import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: path.join(serverRoot, '.env') });

function parseIntOr(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: parseIntOr(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  mongoUri: (process.env.MONGODB_URI || '').trim(),
  dataFile: process.env.DATA_FILE
    ? path.resolve(serverRoot, process.env.DATA_FILE)
    : path.join(serverRoot, 'data', 'appointments.json'),
  serverRoot,
} as const;
