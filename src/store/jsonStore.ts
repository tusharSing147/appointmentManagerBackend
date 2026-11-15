import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { seedAppointments } from '../seedData.js';
import type {
  Appointment,
  AppointmentInput,
  AppointmentListOptions,
} from '../Module/Admin/Appointment/appointment.types.js';
import type { AppointmentStore } from './types.js';

const isMissing = (error: unknown): error is NodeJS.ErrnoException =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as NodeJS.ErrnoException).code === 'ENOENT';

function withSeedMetadata(appointment: AppointmentInput): Appointment {
  return {
    ...appointment,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
}

export async function createJsonStore(filePath: string): Promise<AppointmentStore> {
  const absolutePath = path.resolve(filePath);
  let cache: Appointment[] | null = null;
  let writeQueue: Promise<void> = Promise.resolve();

  async function write(data: Appointment[]): Promise<void> {
    writeQueue = writeQueue.then(async () => {
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      const tempPath = `${absolutePath}.${process.pid}.tmp`;
      await fs.writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
      await fs.rename(tempPath, absolutePath);
    });

    await writeQueue;
  }

  async function read(): Promise<Appointment[]> {
    if (cache) return cache;

    try {
      const raw = await fs.readFile(absolutePath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error(`Data file must contain a JSON array: ${absolutePath}`);
      }
      cache = parsed as Appointment[];
    } catch (error) {
      if (!isMissing(error)) throw error;
      cache = seedAppointments.map(withSeedMetadata);
      await write(cache);
    }

    return cache;
  }

  return {
    kind: 'json-file',

    async list(options: AppointmentListOptions = {}) {
      const { status = 'All', search = '' } = options;
      const rows = await read();
      const term = search.trim().toLowerCase();
      const statusFilter = status || 'All';

      return rows
        .filter((row) => statusFilter === 'All' || row.status === statusFilter)
        .filter(
          (row) => !term || String(row.customerName ?? '').toLowerCase().includes(term),
        )
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
        .map((row) => ({ ...row }));
    },

    async create(input: AppointmentInput) {
      const rows = await read();
      const appointment: Appointment = {
        ...input,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
      };

      rows.push(appointment);
      await write(rows);
      return { ...appointment };
    },

    async updateStatus(id: string, status: Appointment['status']) {
      const rows = await read();
      const appointment = rows.find((row) => row.id === id);
      if (!appointment) return null;

      appointment.status = status;
      appointment.updatedAt = new Date().toISOString();
      await write(rows);
      return { ...appointment };
    },

    async reset(seed: AppointmentInput[] = seedAppointments) {
      cache = seed.map(withSeedMetadata);
      await write(cache);
      return cache.length;
    },

    async close() {},
  };
}
