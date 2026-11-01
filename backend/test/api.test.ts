import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import request from 'supertest';

import { createApp } from '../src/app.ts';
import { createChaos } from '../src/chaos.ts';
import { MAX_IMAGE_BYTES } from '../src/domain.ts';
import { createImageFiles } from '../src/imageFiles.ts';
import { createMemoryStore } from '../src/store/memoryStore.ts';

import type { Express } from 'express';

/** A fake JPEG: correct magic bytes, `size` bytes long. */
const jpeg = (size = 2048) => {
  const bytes = Buffer.alloc(size, 7);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  return bytes;
};

let app: Express;
let chaos: ReturnType<typeof createChaos>;
let uploadDir: string;

beforeEach(async () => {
  uploadDir = await mkdtemp(join(tmpdir(), 'wyxan-uploads-'));
  chaos = createChaos(10);
  app = createApp({
    store: createMemoryStore(),
    files: createImageFiles(uploadDir),
    uploadDir,
    chaos,
    enableAdmin: true,
    log: false,
  });
});

const put = (id: string, position: number, body = jpeg()) =>
  request(app)
    .put(`/reports/${id}/images/${position}`)
    .set('Content-Type', 'image/jpeg')
    .send(body);

const commit = (
  id: string,
  imageCount: number,
  description = 'Crack in wall',
) =>
  request(app)
    .post(`/reports/${id}/commit`)
    .send({ description, imageCount, createdAt: '2026-11-02T09:00:00.000Z' });

describe('image upload', () => {
  it('stores an image and overwrites the same slot on retry', async () => {
    const id = randomUUID();
    assert.equal((await put(id, 0)).status, 200);
    assert.equal((await put(id, 0, jpeg(4096))).status, 200);

    const stored = await readdir(join(uploadDir, id));
    assert.deepEqual(stored, ['0.jpg']); // one file, no temp leftovers
  });

  it('accepts exactly 5,000,000 bytes and refuses one byte more with 413', async () => {
    const id = randomUUID();
    assert.equal((await put(id, 0, jpeg(MAX_IMAGE_BYTES))).status, 200);
    const tooBig = await put(id, 1, jpeg(MAX_IMAGE_BYTES + 1));
    assert.equal(tooBig.status, 413);
    assert.equal(tooBig.body.error, 'imageTooLarge');
  });

  it('rejects bad input with clear 4xx codes', async () => {
    const id = randomUUID();
    assert.equal((await put('not-a-uuid', 0)).status, 400);
    assert.equal((await put(id, 5)).status, 400);
    assert.equal(
      (await put(id, 0, Buffer.from('hello'))).body.error,
      'notJpeg',
    );
    const wrongType = await request(app)
      .put(`/reports/${id}/images/0`)
      .set('Content-Type', 'image/png')
      .send(jpeg());
    assert.equal(wrongType.status, 415);
  });

  it('detects a damaged image with the optional checksum header', async () => {
    const body = jpeg();
    const good = createHash('sha256').update(body).digest('hex');
    const ok = await put(randomUUID(), 0, body).set('X-Content-SHA256', good);
    assert.equal(ok.status, 200);
    const bad = await put(randomUUID(), 0, body).set(
      'X-Content-SHA256',
      'ab'.repeat(32),
    );
    assert.equal(bad.body.error, 'checksumMismatch');
  });
});

describe('commit', () => {
  it('refuses to commit until every image is there, naming the missing ones', async () => {
    const id = randomUUID();
    await put(id, 0);
    await put(id, 2);
    const res = await commit(id, 3);
    assert.equal(res.status, 409);
    assert.deepEqual(res.body.missing, [1]);
  });

  it('is idempotent: first 201, repeats 200, one report on the server', async () => {
    const id = randomUUID();
    await put(id, 0);
    await put(id, 1);

    const first = await commit(id, 2);
    const again = await commit(id, 2);

    assert.equal(first.status, 201);
    assert.equal(again.status, 200);
    assert.equal(again.body.report.receivedAt, first.body.report.receivedAt);
    const list = await request(app).get('/reports');
    assert.equal(list.body.reports.length, 1);
    assert.equal(list.body.reports[0].images.length, 2);
    assert.match(
      list.body.reports[0].images[0].url,
      /^http:\/\/.+\/uploads\/.+\/0\.jpg$/,
    );
  });

  it('validates description and image count (0 and 6 are rejected)', async () => {
    const id = randomUUID();
    await put(id, 0);
    assert.equal((await commit(id, 1, '   ')).body.error, 'invalidDescription');
    assert.equal((await commit(id, 0)).body.error, 'invalidImageCount');
    assert.equal((await commit(id, 6)).body.error, 'invalidImageCount');
  });

  it('lists only complete reports', async () => {
    await put(randomUUID(), 0); // uploaded, never committed
    assert.deepEqual((await request(app).get('/reports')).body.reports, []);
  });
});

describe('chaos', () => {
  it('error500 for the next N requests, then back to normal', async () => {
    await request(app)
      .post('/admin/chaos')
      .send({ mode: 'error500', times: 1 });
    const id = randomUUID();
    assert.equal((await put(id, 0)).status, 500);
    assert.equal((await put(id, 0)).status, 200);
  });

  it('reject413 only affects image uploads, and the phone sees the 413 even for a big body', async () => {
    await request(app).post('/admin/chaos').send({ mode: 'reject413' });
    assert.equal((await put(randomUUID(), 0, jpeg(3_000_000))).status, 413);
    assert.equal((await request(app).get('/reports')).status, 200);
  });

  it('lostResponse: the work is done but the answer is lost; a retry does not duplicate', async () => {
    const id = randomUUID();
    await put(id, 0);
    await request(app)
      .post('/admin/chaos')
      .send({ mode: 'lostResponse', times: 1 });

    await assert.rejects(commit(id, 1)); // connection closed, no answer
    const retry = await commit(id, 1);

    assert.equal(retry.status, 200); // already committed by the "lost" call
    assert.equal((await request(app).get('/reports')).body.reports.length, 1);
  });

  it('drop closes the connection and saves nothing', async () => {
    const id = randomUUID();
    await request(app).post('/admin/chaos').send({ mode: 'drop', times: 1 });
    await assert.rejects(put(id, 0));
    assert.equal((await commit(id, 1)).status, 409);
  });

  it('rejects unknown modes', async () => {
    const res = await request(app)
      .post('/admin/chaos')
      .send({ mode: 'explode' });
    assert.equal(res.status, 400);
  });
});

describe('admin reset', () => {
  it('deletes every report and image', async () => {
    const id = randomUUID();
    await put(id, 0);
    await commit(id, 1);
    await request(app).post('/admin/reset');
    assert.deepEqual((await request(app).get('/reports')).body.reports, []);
    assert.deepEqual(await readdir(uploadDir), []);
  });
});

describe('config', () => {
  it('masks credentials in the MongoDB URI for logs', async () => {
    const { redactUri } = await import('../src/config.ts');
    assert.equal(
      redactUri('mongodb+srv://aqib:s3cret@cluster0.example.net/wyxan'),
      'mongodb+srv://***@cluster0.example.net/wyxan',
    );
    assert.equal(
      redactUri('mongodb://localhost:27017/wyxan'),
      'mongodb://localhost:27017/wyxan',
    );
  });
});
