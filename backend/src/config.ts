import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Optional .env next to package.json (Node's built-in loader, no dotenv).
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export type Config = {
  port: number;
  mongoUri: string;
  uploadDir: string;
  enableAdmin: boolean;
  slowDelayMs: number;
};

/** `mongodb+srv://user:secret@host/db` → `mongodb+srv://***@host/db`, for logs. */
export const redactUri = (uri: string) => uri.replace(/\/\/[^@/]*@/, '//***@');

export const loadConfig = (): Config => ({
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/wyxan',
  uploadDir: resolve(process.env.UPLOAD_DIR ?? './uploads'),
  enableAdmin: (process.env.ENABLE_ADMIN ?? 'true') === 'true',
  slowDelayMs: Number(process.env.SLOW_DELAY_MS ?? 8000),
});
