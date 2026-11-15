import {
  APPOINTMENT_FILTERS,
  APPOINTMENT_STATUSES,
  type AppointmentFilter,
  type AppointmentStatus,
} from './appointment.enum.js';
import type { AppointmentInput } from './appointment.types.js';

export type ValidationResult =
  | { ok: true; value: AppointmentInput }
  | { ok: false; errors: Record<string, string> };

const DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?$/;

const pad = (value: number): string => String(value).padStart(2, '0');

export function normalizeStatus(value: unknown): AppointmentStatus | null {
  const candidate = String(value ?? '').trim().toLowerCase();
  return APPOINTMENT_STATUSES.find((status) => status.toLowerCase() === candidate) ?? null;
}

export function normalizeFilter(value: unknown): AppointmentFilter | null {
  if (value === undefined || value === null || String(value).trim() === '') return 'All';

  const candidate = String(value).trim().toLowerCase();
  return APPOINTMENT_FILTERS.find((filter) => filter.toLowerCase() === candidate) ?? null;
}

/**
 * Accepts "YYYY-MM-DDTHH:mm" (wall-clock, no zone) or an ISO 8601 timestamp.
 * Everything is stored as the same wall-clock format the UI sends so the
 * displayed time never shifts with the server's timezone.
 */
export function normalizeDateTime(input: unknown): string | null {
  if (typeof input !== 'string' || !input.trim()) return null;

  const raw = input.trim();
  const match = DATE_TIME_PATTERN.exec(raw);
  if (!match) return null;

  const [, year, month, day, hour, minute, , , zone] = match;
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  const h = Number(hour);
  const mi = Number(minute);

  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;

  let resolved: { year: number; month: number; day: number; hour: number; minute: number };

  if (zone) {
    const instant = new Date(raw);
    if (Number.isNaN(instant.getTime())) return null;

    resolved = {
      year: instant.getFullYear(),
      month: instant.getMonth() + 1,
      day: instant.getDate(),
      hour: instant.getHours(),
      minute: instant.getMinutes(),
    };
  } else {
    const wallClock = new Date(y, mo - 1, d, h, mi);
    if (
      wallClock.getFullYear() !== y ||
      wallClock.getMonth() !== mo - 1 ||
      wallClock.getDate() !== d
    ) {
      return null;
    }

    resolved = { year: y, month: mo, day: d, hour: h, minute: mi };
  }

  return `${resolved.year}-${pad(resolved.month)}-${pad(resolved.day)}T${pad(resolved.hour)}:${pad(resolved.minute)}`;
}

export function validateAppointment(body: unknown): ValidationResult {
  const source =
    body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const errors: Record<string, string> = {};

  const customerName =
    typeof source.customerName === 'string' ? source.customerName.trim() : '';
  const service = typeof source.service === 'string' ? source.service.trim() : '';
  const dateTime = normalizeDateTime(source.dateTime);
  const status = normalizeStatus(source.status);

  if (!customerName) {
    errors.customerName = 'Enter the customer name.';
  } else if (customerName.length < 2) {
    errors.customerName = 'Use at least 2 characters.';
  } else if (customerName.length > 80) {
    errors.customerName = 'Use 80 characters or fewer.';
  }

  if (!service) {
    errors.service = 'Enter the service.';
  } else if (service.length < 2) {
    errors.service = 'Use at least 2 characters.';
  } else if (service.length > 80) {
    errors.service = 'Use 80 characters or fewer.';
  }

  if (!source.dateTime) {
    errors.dateTime = 'Choose a date and time.';
  } else if (!dateTime) {
    errors.dateTime = 'Enter a valid date and time.';
  }

  if (!status) {
    errors.status = 'Choose Pending, Confirmed or Cancelled.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      customerName,
      service,
      dateTime: dateTime as string,
      status: status as AppointmentStatus,
    },
  };
}
