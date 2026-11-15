export const APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'Cancelled'] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_FILTERS = ['All', ...APPOINTMENT_STATUSES] as const;

export type AppointmentFilter = (typeof APPOINTMENT_FILTERS)[number];
