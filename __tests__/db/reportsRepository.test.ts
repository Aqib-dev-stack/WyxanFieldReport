import { applyMigrations } from '@db/migrate';
import migrations from '@db/migrations/migrations';
import { createProxyDatabase } from '@db/proxy';
import { createReportsRepository } from '@db/repositories/reportsRepository';

import { createNodeSqlite } from '../../jest/nodeSqlite';

import type { MigrationBundle } from '@db/migrate';
import type { NewReportInput } from '@db/repositories/reportsRepository';

const setup = async () => {
  const sqlite = createNodeSqlite();
  const proxy = createProxyDatabase(sqlite.execute);
  await proxy.exclusive(async run => {
    await run('PRAGMA foreign_keys = ON', []);
    await applyMigrations(run, migrations as MigrationBundle);
  });
  return {
    ...proxy,
    sqlite,
    repo: createReportsRepository(proxy.db),
  };
};

const input = (id: string, photos = 2): NewReportInput => ({
  id,
  description: `Report ${id}`,
  createdAt: `2026-11-01T10:0${photos}:00.000Z`,
  images: Array.from({ length: photos }, (_, position) => ({
    id: `${id}-img-${position}`,
    position,
    originalUri: `content://photo/${position}`,
    localPath: `file:///app/photos/${id}-${position}.jpg`,
  })),
});

const count = (sqlite: ReturnType<typeof createNodeSqlite>, table: string) =>
  Number(
    (
      sqlite.database.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as {
        n: number;
      }
    ).n,
  );

describe('migrations', () => {
  it('apply once and are skipped on the next start', async () => {
    const sqlite = createNodeSqlite();
    const bundle = migrations as MigrationBundle;
    expect(await applyMigrations(sqlite.execute, bundle)).toBe(1);
    expect(await applyMigrations(sqlite.execute, bundle)).toBe(0);
  });
});

describe('reportsRepository', () => {
  it('saves a report with its photos and reads it back in order', async () => {
    const { repo } = await setup();
    await repo.create(input('a', 3));

    const report = await repo.getById('a');
    expect(report).toMatchObject({
      id: 'a',
      status: 'queued',
      attemptCount: 0,
      updatedAt: report?.createdAt,
    });
    expect(report?.images.map(image => image.position)).toEqual([0, 1, 2]);
    expect(report?.images[0]?.localUri).toBe('file:///app/photos/a-0.jpg');
  });

  it('returns null for an unknown report', async () => {
    const { repo } = await setup();
    expect(await repo.getById('missing')).toBeNull();
  });

  it('saves all or nothing: a bad photo row leaves no report behind', async () => {
    const { repo, sqlite } = await setup();
    const bad = input('b', 1);
    bad.images.push({ ...bad.images[0]!, id: 'b-img-x', position: 7 });

    await expect(repo.create(bad)).rejects.toThrow();
    expect(count(sqlite, 'reports')).toBe(0);
    expect(count(sqlite, 'report_images')).toBe(0);
  });

  it('rejects saving the same report twice (same client id)', async () => {
    const { repo, sqlite } = await setup();
    await repo.create(input('c', 1));
    await expect(repo.create(input('c', 1))).rejects.toThrow();
    expect(count(sqlite, 'reports')).toBe(1);
  });

  it('lets SQLite reject a status that is not in the list', async () => {
    const { repo, sqlite } = await setup();
    await repo.create(input('d', 1));
    expect(() =>
      sqlite.database.prepare("UPDATE reports SET status = 'done'").run(),
    ).toThrow(/CHECK constraint failed/);
  });

  it('updates status and stamps updatedAt', async () => {
    const { repo } = await setup();
    await repo.create(input('e', 1));
    await repo.update(
      'e',
      { status: 'failed', failureKind: 'permanent', lastError: 'Refused' },
      '2026-11-02T08:00:00.000Z',
    );
    expect(await repo.getById('e')).toMatchObject({
      status: 'failed',
      failureKind: 'permanent',
      lastError: 'Refused',
      updatedAt: '2026-11-02T08:00:00.000Z',
    });
  });

  it('lists newest first', async () => {
    const { repo } = await setup();
    await repo.create(input('old', 1));
    await repo.create(input('new', 4));
    expect((await repo.list()).map(report => report.id)).toEqual([
      'new',
      'old',
    ]);
  });

  it('start over deletes every report and photo row', async () => {
    const { repo, sqlite } = await setup();
    await repo.create(input('f', 2));
    await repo.create(input('g', 1));
    await repo.deleteAll();
    expect(count(sqlite, 'reports')).toBe(0);
    expect(count(sqlite, 'report_images')).toBe(0);
  });

  it('keeps a concurrent save out of another save that rolls back', async () => {
    const { repo } = await setup();
    const bad = input('bad', 1);
    bad.images.push({ ...bad.images[0]!, id: 'bad-img-x', position: 9 });

    // Started together. Without the queue, 'good' could run between the
    // failing save's BEGIN and ROLLBACK and be rolled back with it.
    const [badResult, goodResult] = await Promise.allSettled([
      repo.create(bad),
      repo.create(input('good', 2)),
    ]);

    expect(badResult.status).toBe('rejected');
    expect(goodResult.status).toBe('fulfilled');
    expect((await repo.list()).map(report => report.id)).toEqual(['good']);
  });
});
