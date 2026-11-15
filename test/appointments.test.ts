import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { createJsonStore } from '../src/store/jsonStore.js';
import { seedAppointments } from '../src/seedData.js';
import type { AppointmentStore } from '../src/store/types.js';

let directory: string;
let dataFile: string;
let store: AppointmentStore;
let app: Express;

before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'daybook-test-'));
  dataFile = path.join(directory, 'appointments.json');
  store = await createJsonStore(dataFile);
  app = createApp({ store, corsOrigin: '*' });
});

after(async () => {
  await store.close();
  await rm(directory, { recursive: true, force: true });
});

beforeEach(async () => {
  await store.reset(seedAppointments);
});

describe('GET /api/appointments', () => {
  it('returns the seeded appointments sorted by date and time', async () => {
    const response = await request(app).get('/api/appointments').expect(200);

    assert.equal(response.body.data.length, 3);
    assert.deepEqual(
      response.body.data.map((row: { customerName: string }) => row.customerName),
      ['Alex Morgan', 'Jamie Lee', 'Taylor Smith'],
    );
    assert.deepEqual(response.body.meta.counts, {
      All: 3,
      Pending: 1,
      Confirmed: 1,
      Cancelled: 1,
    });
  });

  it('filters by status, case-insensitively', async () => {
    const response = await request(app)
      .get('/api/appointments?status=confirmed')
      .expect(200);

    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].customerName, 'Jamie Lee');
  });

  it('returns an empty list when nothing matches the search', async () => {
    const response = await request(app)
      .get('/api/appointments?search=zzz-no-match')
      .expect(200);

    assert.equal(response.body.data.length, 0);
    assert.deepEqual(response.body.meta.counts, {
      All: 0,
      Pending: 0,
      Confirmed: 0,
      Cancelled: 0,
    });
  });

  it('searches customer names case-insensitively and recalculates counts', async () => {
    const response = await request(app)
      .get('/api/appointments?search=JAM')
      .expect(200);

    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].customerName, 'Jamie Lee');
    assert.equal(response.body.meta.counts.All, 1);
    assert.equal(response.body.meta.counts.Confirmed, 1);
  });

  it('combines status filtering with customer search', async () => {
    const response = await request(app)
      .get('/api/appointments?status=Pending&search=alex')
      .expect(200);

    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].customerName, 'Alex Morgan');
  });

  it('rejects an unknown status filter', async () => {
    const response = await request(app)
      .get('/api/appointments?status=Archived')
      .expect(400);

    assert.match(response.body.error, /status filter/i);
  });
});

describe('POST /api/appointments', () => {
  it('creates an appointment, normalises whitespace and date/time, and persists it', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .send({
        customerName: '  Robin Park  ',
        service: ' Assessment ',
        dateTime: '2026-11-04 09:15',
        status: 'pending',
      })
      .expect(201);

    assert.ok(response.body.data.id);
    assert.equal(response.body.data.customerName, 'Robin Park');
    assert.equal(response.body.data.service, 'Assessment');
    assert.equal(response.body.data.dateTime, '2026-11-04T09:15');
    assert.equal(response.body.data.status, 'Pending');

    const list = await request(app).get('/api/appointments').expect(200);
    assert.equal(list.body.data.length, 4);
    assert.equal(list.body.meta.counts.All, 4);
    assert.equal(list.body.meta.counts.Pending, 2);
  });

  it('rejects an empty payload with field-level errors', async () => {
    const response = await request(app).post('/api/appointments').send({}).expect(400);

    assert.deepEqual(Object.keys(response.body.errors).sort(), [
      'customerName',
      'dateTime',
      'service',
      'status',
    ]);
  });

  it('rejects an impossible calendar date and an unknown status', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .send({
        customerName: 'Sam Reed',
        service: 'Review',
        dateTime: '2026-02-30T09:00',
        status: 'Done',
      })
      .expect(400);

    assert.ok(response.body.errors.dateTime);
    assert.ok(response.body.errors.status);
  });

  it('rejects malformed JSON bodies', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .set('Content-Type', 'application/json')
      .send('{"customerName":')
      .expect(400);

    assert.match(response.body.error, /valid JSON/i);
  });
});

describe('PATCH /api/appointments/:id/status', () => {
  it('updates an appointment status', async () => {
    const list = await request(app).get('/api/appointments').expect(200);
    const alex = list.body.data.find(
      (row: { customerName: string }) => row.customerName === 'Alex Morgan',
    );

    const response = await request(app)
      .patch(`/api/appointments/${alex.id}/status`)
      .send({ status: 'Confirmed' })
      .expect(200);

    assert.equal(response.body.data.status, 'Confirmed');

    const confirmed = await request(app)
      .get('/api/appointments?status=Confirmed')
      .expect(200);
    assert.equal(confirmed.body.data.length, 2);
  });

  it('rejects an invalid status', async () => {
    const list = await request(app).get('/api/appointments').expect(200);
    const id = list.body.data[0].id;

    const response = await request(app)
      .patch(`/api/appointments/${id}/status`)
      .send({ status: 'Archived' })
      .expect(400);

    assert.ok(response.body.errors.status);
  });

  it('returns 404 for an unknown appointment', async () => {
    await request(app)
      .patch('/api/appointments/does-not-exist/status')
      .send({ status: 'Cancelled' })
      .expect(404);
  });
});

describe('persistence', () => {
  it('keeps created appointments when the store is reopened', async () => {
    await request(app)
      .post('/api/appointments')
      .send({
        customerName: 'Casey Nguyen',
        service: 'Consultation',
        dateTime: '2026-11-05T16:45',
        status: 'Confirmed',
      })
      .expect(201);

    const reopened = await createJsonStore(dataFile);
    const rows = await reopened.list({ status: 'All', search: 'casey' });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].service, 'Consultation');
  });

  it('reports the active storage engine in the health endpoint', async () => {
    const response = await request(app).get('/api/health').expect(200);
    assert.equal(response.body.status, 'ok');
    assert.equal(response.body.storage, 'json-file');
  });
});
