import { mkdir } from 'node:fs/promises';

import { createApp } from './app.ts';
import { createChaos } from './chaos.ts';
import { loadConfig, redactUri } from './config.ts';
import { createImageFiles } from './imageFiles.ts';
import { connectMongo, createMongoStore } from './store/mongoStore.ts';

const config = loadConfig();

await mkdir(config.uploadDir, { recursive: true });
await connectMongo(config.mongoUri);

const app = createApp({
  store: createMongoStore(),
  files: createImageFiles(config.uploadDir),
  uploadDir: config.uploadDir,
  chaos: createChaos(config.slowDelayMs),
  enableAdmin: config.enableAdmin,
});

const server = app.listen(config.port, () => {
  console.log(`API on http://localhost:${config.port}`);
  // Never print credentials (screen recordings, shared logs).
  console.log(`MongoDB: ${redactUri(config.mongoUri)}`);
  console.log(`Images: ${config.uploadDir}`);
  console.log(`Admin/chaos endpoints: ${config.enableAdmin ? 'on' : 'off'}`);
  console.log(
    `App: API_BASE_URL=http://<this computer's Wi-Fi IP>:${config.port} in src/config/api.ts`,
  );
});

// A 5 MB photo over 2G (~20–40 KB/s) can take several minutes: give
// requests 10 minutes instead of Node's default 5 before cutting them off.
server.requestTimeout = 10 * 60 * 1000;
