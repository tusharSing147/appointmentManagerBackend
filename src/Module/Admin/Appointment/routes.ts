import { Router } from 'express';
import { createAppointmentController } from './controller.js';
import type { AppointmentStore } from '../../../store/types.js';

export function appointmentsRouter(store: AppointmentStore): Router {
  const router = Router();
  const controller = createAppointmentController(store);

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.patch('/:id/status', controller.updateStatus);

  return router;
}
