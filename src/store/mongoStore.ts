import mongoose from 'mongoose';
import { APPOINTMENT_STATUSES } from '../Module/Admin/Appointment/appointment.enum.js';
import { seedAppointments } from '../seedData.js';
import type {
  Appointment,
  AppointmentInput,
  AppointmentListOptions,
} from '../Module/Admin/Appointment/appointment.types.js';
import type { AppointmentStore } from './types.js';

const appointmentSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true, maxlength: 80 },
    service: { type: String, required: true, trim: true, maxlength: 80 },
    dateTime: { type: String, required: true },
    status: { type: String, enum: APPOINTMENT_STATUSES, required: true },
  },
  { timestamps: true, versionKey: false },
);

appointmentSchema.set('toJSON', {
  virtuals: true,
  transform: (_document, result: Record<string, unknown>) => {
    result.id = String(result._id);
    delete result._id;
    return result;
  },
});

const AppointmentModel = mongoose.model('Appointment', appointmentSchema);

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function createMongoStore(uri: string): Promise<AppointmentStore> {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });

  return {
    kind: 'mongodb',

    async list(options: AppointmentListOptions = {}) {
      const { status = 'All', search = '' } = options;
      const query: Record<string, unknown> = {};

      if (status && status !== 'All') query.status = status;
      if (search.trim()) {
        query.customerName = new RegExp(escapeRegExp(search.trim()), 'i');
      }

      const rows = await AppointmentModel.find(query).sort({ dateTime: 1, createdAt: 1 });
      return rows.map((row) => row.toJSON() as unknown as Appointment);
    },

    async create(input: AppointmentInput) {
      const created = await AppointmentModel.create(input);
      return created.toJSON() as unknown as Appointment;
    },

    async updateStatus(id: string, status: Appointment['status']) {
      if (!mongoose.isValidObjectId(id)) return null;

      const updated = await AppointmentModel.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true },
      );

      return updated ? (updated.toJSON() as unknown as Appointment) : null;
    },

    async reset(seed: AppointmentInput[] = seedAppointments) {
      await AppointmentModel.deleteMany({});
      if (seed.length) await AppointmentModel.insertMany(seed);
      return seed.length;
    },

    async close() {
      await mongoose.disconnect();
    },
  };
}
