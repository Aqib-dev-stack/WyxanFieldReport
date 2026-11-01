import { applyMigrations } from '@db/migrate';
import migrations from '@db/migrations/migrations';
import { createProxyDatabase } from '@db/proxy';
import { createReportsRepository } from '@db/repositories/reportsRepository';
import {
  createReportService,
  InvalidReportError,
} from '@services/reports/reportService';

import { createNodeSqlite } from '../../jest/nodeSqlite';

import type { DraftPhoto } from '@app-types';
import type { MigrationBundle } from '@db/migrate';
import type { FileStorage } from '@services/files/fileStorage';

const photo = (n: number): DraftPhoto => ({
  id: `draft-${n}`,
  uri: `file:///cache/picked-${n}.jpg`,
  width: 4000,
  height: 3000,
  sizeBytes: 18_000_000,
});

/** File storage double that records what exists, with an optional failure. */
const fakeFiles = (failOnPosition?: number) => {
  const stored = new Set<string>();
  const storage: FileStorage = {
    copyIntoAppStorage: async (_uri, reportId, position) => {
      if (position === failOnPosition) {
        throw new Error('Disk full');
      }
      const path = `/docs/reports/${reportId}/${position}-original.jpg`;
      stored.add(path);
      return path;
    },
    deleteReportFiles: async reportId => {
      [...stored]
        .filter(path => path.includes(`/${reportId}/`))
        .forEach(path => stored.delete(path));
    },
    deleteAllReportFiles: async () => stored.clear(),
  };
  return { storage, stored };
};

const setup = async (failOnPosition?: number) => {
  const sqlite = createNodeSqlite();
  const proxy = createProxyDatabase(sqlite.execute);
  await proxy.exclusive(async run => {
    await run('PRAGMA foreign_keys = ON', []);
    await applyMigrations(run, migrations as MigrationBundle);
  });
  const files = fakeFiles(failOnPosition);
  let ids = 0;
  const service = createReportService({
    repository: createReportsRepository(proxy.db),
    files: files.storage,
    newId: () => `id-${++ids}`,
    now: () => '2026-11-02T09:00:00.000Z',
  });
  return { service, files };
};

describe('reportService.createReport', () => {
  it('copies photos into app storage, saves, and publishes the new list', async () => {
    const { service, files } = await setup();
    const listener = jest.fn();
    service.subscribe(listener);

    const id = await service.createReport({
      description: '  Crack in wall  ',
      photos: [photo(1), photo(2)],
    });

    expect(files.stored.size).toBe(2);
    expect(listener).toHaveBeenCalled();
    const [saved] = service.getSnapshot();
    expect(saved).toMatchObject({
      id,
      description: 'Crack in wall',
      status: 'queued',
    });
    expect(saved?.images.map(image => image.localUri)).toEqual([
      `file:///docs/reports/${id}/0-original.jpg`,
      `file:///docs/reports/${id}/1-original.jpg`,
    ]);
  });

  it('saves nothing and leaves no files when a photo copy fails', async () => {
    const { service, files } = await setup(1);
    await expect(
      service.createReport({
        description: 'Crack',
        photos: [photo(1), photo(2), photo(3)],
      }),
    ).rejects.toThrow('Disk full');

    expect(files.stored.size).toBe(0);
    await service.refresh();
    expect(service.getSnapshot()).toEqual([]);
  });

  it('refuses an invalid draft (blank description, 0 or 6 photos)', async () => {
    const { service } = await setup();
    await expect(
      service.createReport({ description: '   ', photos: [photo(1)] }),
    ).rejects.toBeInstanceOf(InvalidReportError);
    await expect(
      service.createReport({ description: 'Crack', photos: [] }),
    ).rejects.toBeInstanceOf(InvalidReportError);
    await expect(
      service.createReport({
        description: 'Crack',
        photos: [1, 2, 3, 4, 5, 6].map(photo),
      }),
    ).rejects.toBeInstanceOf(InvalidReportError);
  });
});

describe('reportService.startOver', () => {
  it('removes every report and every copied photo', async () => {
    const { service, files } = await setup();
    await service.createReport({ description: 'A', photos: [photo(1)] });
    await service.createReport({ description: 'B', photos: [photo(2)] });

    await service.startOver();

    expect(service.getSnapshot()).toEqual([]);
    expect(files.stored.size).toBe(0);
  });
});
