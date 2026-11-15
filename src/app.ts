import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express, {
  type ErrorRequestHandler,
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import cors from 'cors';
import { appointmentsRouter } from './Module/Admin/Appointment/routes.js';
import type { AppointmentStore } from './store/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface CreateAppOptions {
  store: AppointmentStore;
  corsOrigin?: string;
}

export function createApp({ store, corsOrigin = '*' }: CreateAppOptions): Express {
  if (!store) throw new Error('createApp requires a store');

  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', storage: store.kind });
  });

  app.use('/api/appointments', appointmentsRouter(store));

  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));

    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    const errorType =
      error !== null && typeof error === 'object'
        ? (error as { type?: string }).type
        : undefined;

    if (errorType === 'entity.parse.failed') {
      res.status(400).json({ error: 'Request body must be valid JSON.' });
      return;
    }

    console.error('[api] unhandled error:', error);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  };

  app.use(errorHandler);

  return app;
}
