import { applyMigrations } from '@db/migrate';
import migrations from '@db/migrations/migrations';
import { createProxyDatabase } from '@db/proxy';
import { createReportsRepository } from '@db/repositories/reportsRepository';
import { createImagePreparer } from '@services/images/imagePreparer';

import { createNodeSqlite } from '../../jest/nodeSqlite';

import type { MigrationBundle } from '@db/migrate';
import type { ImageCompressor } from '@services/images/imageCompressor';

const setup = async (compress: ImageCompressor) => {
  const sqlite = createNodeSqlite();
  const proxy = createProxyDatabase(sqlite.execute);
  await proxy.exclusive(async run => {
    await run('PRAGMA foreign_keys = ON', []);
    await applyMigrations(run, migrations as MigrationBundle);
  });
  const repository = createReportsRepository(proxy.db);
  const preparer = createImagePreparer({
    repository,
    compress,
    files: {
      keepUploadFile: async (_temp, reportId, position) =>
        `/docs/${reportId}/${position}-upload.jpg`,
    },
    folderFor: id => `/docs/${id}`,
    onChange: async () => undefined,
  });
  return { repository, preparer };
};

const save = (
  repository: ReturnType<typeof createReportsRepository>,
  id: string,
  photos: number,
  createdAt = '2026-11-02T09:00:00.000Z',
) =>
  repository.create({
    id,
    description: id,
    createdAt,
    images: Array.from({ length: photos }, (_, position) => ({
      id: `${id}-${position}`,
      position,
      originalUri: `file:///cache/${position}.jpg`,
      localPath: `/docs/${id}/${position}-original.jpg`,
    })),
  });

const okCompressor = () =>
  jest.fn<ReturnType<ImageCompressor>, Parameters<ImageCompressor>>(
    async source => ({
      path: `${source}.tmp`,
      sizeBytes: 2_100_000,
      width: 3264,
      height: 2448,
    }),
  );

describe('imagePreparer', () => {
  it('compresses every photo, records each one, and re-queues the report', async () => {
    const compress = okCompressor();
    const { repository, preparer } = await setup(compress);
    await save(repository, 'a', 5);

    await preparer.run();

    const report = await repository.getById('a');
    expect(compress).toHaveBeenCalledTimes(5);
    expect(report?.status).toBe('queued');
    expect(report?.images.every(image => image.status === 'compressed')).toBe(
      true,
    );
    expect(report?.images[0]).toMatchObject({
      uploadPath: '/docs/a/0-upload.jpg',
      sizeBytes: 2_100_000,
    });
  });

  it('resumes after a force-quit from the first unfinished photo', async () => {
    const compress = okCompressor();
    const { repository, preparer } = await setup(compress);
    await save(repository, 'b', 4);
    // State left by a crash: report mid-compression, 2 of 4 photos done.
    await repository.update('b', { status: 'compressing' });
    await repository.updateImage('b-0', { status: 'compressed' });
    await repository.updateImage('b-1', { status: 'compressed' });

    await preparer.run();

    expect(compress.mock.calls.map(([source]) => source)).toEqual([
      '/docs/b/2-original.jpg',
      '/docs/b/3-original.jpg',
    ]);
    expect((await repository.getById('b'))?.status).toBe('queued');
  });

  it('marks the report failed (needs attention) when a photo cannot be prepared', async () => {
    const compress = jest.fn<
      ReturnType<ImageCompressor>,
      Parameters<ImageCompressor>
    >(async () => {
      throw new Error('File not found');
    });
    const { repository, preparer } = await setup(compress);
    await save(repository, 'c', 1);
    await save(repository, 'd', 1, '2026-11-02T09:05:00.000Z');

    await preparer.run();

    expect(await repository.getById('c')).toMatchObject({
      status: 'failed',
      failureKind: 'permanent',
    });
    // One broken report doesn't stop the others from being tried.
    expect((await repository.getById('d'))?.status).toBe('failed');
    expect(compress).toHaveBeenCalledTimes(2);
  });

  it('runs once even when triggered twice at the same time', async () => {
    const compress = okCompressor();
    const { repository, preparer } = await setup(compress);
    await save(repository, 'e', 3);

    await Promise.all([preparer.run(), preparer.run()]);

    expect(compress).toHaveBeenCalledTimes(3);
  });

  it('stops after the current photo when paused, and leaves the rest pending', async () => {
    const { repository, preparer } = await setup(okCompressor());
    await save(repository, 'f', 3);

    const running = preparer.run();
    await preparer.pause();
    await running;

    const report = await repository.getById('f');
    expect(report?.status).toBe('compressing');
    expect(report?.images.some(image => image.status === 'pending')).toBe(true);
  });
});
