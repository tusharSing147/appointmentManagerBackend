import { createJsonStore } from './jsonStore.js';
import type { AppointmentStore } from './types.js';

export interface StoreConfig {
  mongoUri?: string;
  dataFile: string;
}

/**
 * Prefers MongoDB when MONGODB_URI is configured. If the connection fails the
 * API reports the problem and falls back to the JSON file store so the demo is
 * never blocked by a missing local database.
 */
export async function createStore({ mongoUri, dataFile }: StoreConfig): Promise<AppointmentStore> {
  if (mongoUri) {
    try {
      const { createMongoStore } = await import('./mongoStore.js');
      const store = await createMongoStore(mongoUri);
      console.log('[store] connected to MongoDB');
      return store;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[store] MongoDB connection failed (${message}). Falling back to JSON file storage.`,
      );
    }
  }

  console.log(`[store] using JSON file storage at ${dataFile}`);
  return createJsonStore(dataFile);
}
