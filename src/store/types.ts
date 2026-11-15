import type { AppointmentStatus } from '../Module/Admin/Appointment/appointment.enum.js';
import type {
  Appointment,
  AppointmentInput,
  AppointmentListOptions,
} from '../Module/Admin/Appointment/appointment.types.js';

export interface AppointmentStore {
  readonly kind: 'json-file' | 'mongodb';
  list(options?: AppointmentListOptions): Promise<Appointment[]>;
  create(input: AppointmentInput): Promise<Appointment>;
  updateStatus(id: string, status: AppointmentStatus): Promise<Appointment | null>;
  reset(seed?: AppointmentInput[]): Promise<number>;
  close(): Promise<void>;
}
