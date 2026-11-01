import { applyMigrations } from '@db/migrate';
import migrations from '@db/migrations/migrations';
import { createProxyDatabase } from '@db/proxy';
import { createReportsRepository } from '@db/repositories/reportsRepository';
import { createUploadEngine } from '@services/upload/uploadEngine';

import { createNodeSqlite } from '../../jest/nodeSqlite';

import type { ApiError, ApiResult } from '@app-types';
import type { MigrationBundle } from '@db/migrate';
import type {
  CommitInput,
  ReportsApi,
  UploadImageInput,
} from '@services/api/reportsApi';

type Failure = ApiError | 'lostResponse';

/**
 * In-memory server with the real backend's rules: images by (id, position),
 * overwritten on re-send; commit needs every image, first call creates,
 * repeats return the stored report. Scripted failures play the chaos modes.
 */
const createFakeServer = () => {
  const images = new Map<string, Set<number>>();
  const reports = new Map<string, CommitInput>();
  const script: { upload: Failure[]; commit: Failure[] } = {
    upload: [],
    commit: [],
  };
  const calls = { upload: 0, commit: 0 };
  let uploadGate: Promise<void> | null = null;

  const fail = (failure: Failure): ApiResult<unknown> => ({
    ok: false,
    error: failure === 'lostResponse' ? { kind: 'offline' } : failure,
  });

  const api: ReportsApi = {
    async uploadImage({ reportId, position, signal }: UploadImageInput) {
      calls.upload += 1;
      if (uploadGate) {
        await Promise.race([
          uploadGate,
          new Promise<void>(resolve =>
            signal?.addEventListener('abort', () => resolve()),
          ),
        ]);
        if (signal?.aborted) {
          return { ok: false, error: { kind: 'offline' } };
        }
      }
      const failure = script.upload.shift();
      if (failure && failure !== 'lostResponse') {
        return fail(failure);
      }
      const slots = images.get(reportId) ?? new Set<number>();
      slots.add(position);
      images.set(reportId, slots);
      return failure ? fail(failure) : { ok: true, data: {} };
    },
    async commitReport(input: CommitInput) {
      calls.commit += 1;
      const failure = script.commit.shift();
      if (failure && failure !== 'lostResponse') {
        return fail(failure);
      }
      if (!reports.has(input.id)) {
        const have = images.get(input.id) ?? new Set<number>();
        const missing = Array.from(
          { length: input.imageCount },
          (_, i) => i,
        ).filter(i => !have.has(i));
        if (missing.length > 0) {
          return {
            ok: false,
            error: {
              kind: 'rejected',
              status: 409,
              code: 'missingImages',
              missing,
            },
          };
        }
        reports.set(input.id, input);
      }
      return failure ? fail(failure) : { ok: true, data: {} };
    },
    listReports: async () => ({ ok: true, data: [] }),
  };

  return {
    api,
    script,
    calls,
    images,
    reports,
    holdUploads() {
      let release = () => undefined as void;
      uploadGate = new Promise<void>(resolve => {
        release = resolve;
      });
      return () => {
        uploadGate = null;
        release();
      };
    },
  };
};

const setup = async ({ fileSize = 2_000_000 } = {}) => {
  const sqlite = createNodeSqlite();
  const proxy = createProxyDatabase(sqlite.execute);
  await proxy.exclusive(async run => {
    await run('PRAGMA foreign_keys = ON', []);
    await applyMigrations(run, migrations as MigrationBundle);
  });
  const repository = createReportsRepository(proxy.db);
  const server = createFakeServer();
  let clock = Date.parse('2026-11-02T09:00:00.000Z');
  const timers: { callback: () => void; at: number }[] = [];

  const engine = createUploadEngine({
    repository,
    api: server.api,
    files: { sizeOf: async () => fileSize, sha256: async () => 'f'.repeat(64) },
    maxImageBytes: 5_000_000,
    now: () => clock,
    random: () => 1,
    setTimer: (callback, ms) => {
      const timer = { callback, at: clock + ms };
      timers.push(timer);
      return timer;
    },
    clearTimer: handle => {
      const index = timers.indexOf(handle as (typeof timers)[number]);
      if (index >= 0) {
        timers.splice(index, 1);
      }
    },
    onChange: async () => undefined,
  });

  /** Moves the clock to the next scheduled retry, fires it, waits for it. */
  const advanceToNextRetry = async () => {
    const timer = timers.sort((a, b) => a.at - b.at).shift();
    if (!timer) {
      throw new Error('No retry scheduled');
    }
    clock = timer.at;
    timer.callback();
    await engine.run();
  };

  /** A saved report whose photos are compressed and ready to upload. */
  const saveReady = async (id: string, photos: number, minutes = 0) => {
    await repository.create({
      id,
      description: `Report ${id}`,
      createdAt: new Date(clock + minutes * 60_000).toISOString(),
      images: Array.from({ length: photos }, (_, position) => ({
        id: `${id}-${position}`,
        position,
        originalUri: `file:///cache/${position}.jpg`,
        localPath: `/docs/${id}/${position}-original.jpg`,
      })),
    });
    for (let position = 0; position < photos; position += 1) {
      await repository.updateImage(`${id}-${position}`, {
        status: 'compressed',
        compressedPath: `/docs/${id}/${position}-upload.jpg`,
        sizeBytes: fileSize,
      });
    }
  };

  return {
    repository,
    server,
    engine,
    timers,
    saveReady,
    advanceToNextRetry,
  };
};

describe('uploadEngine', () => {
  it('uploads every photo, then commits: the server has it exactly once', async () => {
    const { engine, server, repository, saveReady } = await setup();
    await saveReady('a', 5);

    await engine.run();

    expect(server.images.get('a')?.size).toBe(5);
    expect(server.reports.size).toBe(1);
    expect(await repository.getById('a')).toMatchObject({
      status: 'uploaded',
      lastError: null,
    });
    expect(engine.getProgress()).toEqual({});
  });

  it('survives a connection dropped twice mid-upload, without re-sending finished photos', async () => {
    const { engine, server, repository, saveReady, advanceToNextRetry } =
      await setup();
    await saveReady('b', 5);
    // Photo 3 fails (dropped), then fails again on the first retry.
    let sent = 0;
    const realUpload = server.api.uploadImage;
    server.api.uploadImage = async input => {
      sent += 1;
      if (sent === 3 || sent === 4) {
        return { ok: false, error: { kind: 'offline' } };
      }
      return realUpload(input);
    };

    await engine.run();
    expect(await repository.getById('b')).toMatchObject({
      status: 'waitingNet',
      attemptCount: 1,
    });

    await advanceToNextRetry(); // dropped again
    expect((await repository.getById('b'))?.attemptCount).toBe(2);

    await advanceToNextRetry(); // goes through
    expect((await repository.getById('b'))?.status).toBe('uploaded');
    // 5 photos + 2 failed attempts at photo 3; photos 1–2 never re-sent.
    expect(sent).toBe(7);
    expect(server.reports.size).toBe(1);
  });

  it('a lost commit response is retried and still lands only once', async () => {
    const { engine, server, repository, saveReady, advanceToNextRetry } =
      await setup();
    await saveReady('c', 2);
    server.script.commit = ['lostResponse'];

    await engine.run();
    expect((await repository.getById('c'))?.status).toBe('waitingNet');
    expect(server.reports.size).toBe(1); // the server did commit

    await advanceToNextRetry();
    expect((await repository.getById('c'))?.status).toBe('uploaded');
    expect(server.calls.commit).toBe(2);
    expect(server.reports.size).toBe(1);
  });

  it('retries a 500 after the backoff, not before', async () => {
    const {
      engine,
      server,
      repository,
      saveReady,
      timers,
      advanceToNextRetry,
    } = await setup();
    await saveReady('d', 1);
    server.script.commit = [{ kind: 'server', status: 500 }];

    await engine.run();
    const waiting = await repository.getById('d');
    expect(waiting).toMatchObject({
      status: 'queued',
      failureKind: 'retryable',
    });
    expect(timers).toHaveLength(1);

    await engine.run(); // a trigger before the backoff is over: nothing happens
    expect(server.calls.commit).toBe(1);

    await advanceToNextRetry();
    expect((await repository.getById('d'))?.status).toBe('uploaded');
  });

  it('does not retry a 413, and carries on with the next report', async () => {
    const { engine, server, repository, saveReady, timers } = await setup();
    await saveReady('e', 1);
    await saveReady('f', 1, 1);
    server.script.upload = [{ kind: 'rejected', status: 413 }];

    await engine.run();

    expect(await repository.getById('e')).toMatchObject({
      status: 'failed',
      failureKind: 'permanent',
      lastError: 'The server refused a photo as too large.',
    });
    expect((await repository.getById('f'))?.status).toBe('uploaded');
    expect(timers).toHaveLength(0);
  });

  it('resumes after a force-quit from the first photo not yet uploaded', async () => {
    const { engine, server, repository, saveReady } = await setup();
    await saveReady('g', 4);
    // State left by a force-quit during photo 3.
    await repository.update('g', { status: 'uploading' });
    await repository.updateImage('g-0', { status: 'uploaded' });
    await repository.updateImage('g-1', { status: 'uploaded' });
    server.images.set('g', new Set([0, 1]));

    await engine.run();

    expect(server.calls.upload).toBe(2);
    expect((await repository.getById('g'))?.status).toBe('uploaded');
  });

  it('re-sends only the photos the server says it is missing', async () => {
    const { engine, server, repository, saveReady, advanceToNextRetry } =
      await setup();
    await saveReady('h', 3);
    // Locally all uploaded, but the server lost photo 1 (e.g. disk wiped).
    for (const n of [0, 1, 2]) {
      await repository.updateImage(`h-${n}`, { status: 'uploaded' });
    }
    await repository.update('h', { status: 'committing' });
    server.images.set('h', new Set([0, 2]));

    await engine.run();
    expect((await repository.getById('h'))?.images[1]?.status).toBe(
      'compressed',
    );
    await advanceToNextRetry();

    expect(server.calls.upload).toBe(1);
    expect((await repository.getById('h'))?.status).toBe('uploaded');
  });

  it('never sends a file over 5 MB', async () => {
    const { engine, server, repository, saveReady } = await setup({
      fileSize: 5_000_001,
    });
    await saveReady('i', 1);

    await engine.run();

    expect(server.calls.upload).toBe(0);
    expect((await repository.getById('i'))?.status).toBe('failed');
  });

  it('runs once when triggered twice at the same time', async () => {
    const { engine, server, saveReady } = await setup();
    await saveReady('j', 3);

    await Promise.all([engine.run(), engine.run()]);

    expect(server.calls.upload).toBe(3);
    expect(server.calls.commit).toBe(1);
  });

  it('pause aborts the upload in flight and leaves the report to resume', async () => {
    const { engine, server, repository, saveReady } = await setup();
    await saveReady('k', 2);
    const release = server.holdUploads();

    const running = engine.run();
    await new Promise<void>(resolve => setTimeout(resolve, 10));
    await engine.pause();
    await running;
    release();

    expect((await repository.getById('k'))?.status).toBe('uploading');
    expect((await repository.getById('k'))?.attemptCount).toBe(0);

    engine.resume();
    await engine.run();
    expect((await repository.getById('k'))?.status).toBe('uploaded');
  });

  it('reports byte progress while a photo is uploading', async () => {
    const { engine, server, saveReady } = await setup();
    await saveReady('l', 2);
    const seen: number[] = [];
    const realUpload = server.api.uploadImage;
    server.api.uploadImage = async input => {
      input.onProgress?.(0.5);
      seen.push(engine.getProgress().l?.fraction ?? -1);
      return realUpload(input);
    };

    await engine.run();

    // Halfway through photo 1 of 2 = 25%; halfway through photo 2 = 75%.
    expect(seen).toEqual([0.25, 0.75]);
  });
});
