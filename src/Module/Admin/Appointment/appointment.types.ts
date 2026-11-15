import type { AppointmentStatus } from './appointment.enum.js';

export interface AppointmentInput {
  customerName: string;
  service: string;
  dateTime: string;
  status: AppointmentStatus;
}

export interface Appointment extends AppointmentInput {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppointmentListOptions {
  status?: string;
  search?: string;
}
