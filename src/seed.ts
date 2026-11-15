import { config } from './config.js';
import { createStore } from './store/index.js';

const store = await createStore(config);
const count = await store.reset();

console.log(`[seed] reset ${store.kind} store with ${count} appointments.`);
await store.close();
