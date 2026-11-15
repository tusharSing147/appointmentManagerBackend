import { config } from './config.js';
import { createApp } from './app.js';
import { createStore } from './store/index.js';

const store = await createStore(config);
const app = createApp({ store, corsOrigin: config.corsOrigin });

const server = app.listen(config.port, () => {
  console.log(`[api] Daybook API listening on http://localhost:${config.port}`);
  console.log(`[api] health check: http://localhost:${config.port}/api/health`);
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  console.log(`\n[api] ${signal} received, shutting down.`);
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
