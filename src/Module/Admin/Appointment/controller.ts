import type { NextFunction, Request, Response } from 'express';
import type { AppointmentFilter } from './appointment.enum.js';
import {
  normalizeFilter,
  normalizeStatus,
  validateAppointment,
} from './appointment.validation.js';
import type { AppointmentStore } from '../../../store/types.js';

export interface AppointmentController {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createAppointmentController(store: AppointmentStore): AppointmentController {
  return {
    async list(req, res, next) {
      try {
        const status = normalizeFilter(req.query.status);
        if (!status) {
          res.status(400).json({
            error: 'Status filter must be All, Pending, Confirmed or Cancelled.',
          });
          return;
        }

        const search = typeof req.query.search === 'string' ? req.query.search : '';

        const [data, searchMatches] = await Promise.all([
          store.list({ status, search }),
          store.list({ search }),
        ]);

        const counts: Record<AppointmentFilter, number> = {
          All: searchMatches.length,
          Pending: 0,
          Confirmed: 0,
          Cancelled: 0,
        };

        for (const appointment of searchMatches) {
          counts[appointment.status] += 1;
        }

        res.json({ data, meta: { counts, shown: data.length } });
      } catch (error) {
        next(error);
      }
    },

    async create(req, res, next) {
      try {
        const result = validateAppointment(req.body);
        if (!result.ok) {
          res.status(400).json({
            error: 'Please fix the highlighted fields.',
            errors: result.errors,
          });
          return;
        }

        const created = await store.create(result.value);
        res.status(201).json({ data: created });
      } catch (error) {
        next(error);
      }
    },

    async updateStatus(req, res, next) {
      try {
        const body =
          req.body !== null && typeof req.body === 'object'
            ? (req.body as { status?: unknown })
            : undefined;
        const status = normalizeStatus(body?.status);

        if (!status) {
          res.status(400).json({
            error: 'Choose Pending, Confirmed or Cancelled.',
            errors: { status: 'Choose Pending, Confirmed or Cancelled.' },
          });
          return;
        }

        const updated = await store.updateStatus(req.params.id, status);
        if (!updated) {
          res.status(404).json({ error: 'Appointment not found.' });
          return;
        }

        res.json({ data: updated });
      } catch (error) {
        next(error);
      }
    },
  };
}
