import crypto from 'crypto';

import type {
  AuditLogRecord,
  CounsellingRecord,
  CounsellorRecord,
  DemoBookingRecord,
  LeadRecord,
  NotificationLogRecord,
  StudentRecord,
  TimeSlotConfig,
} from '@/lib/storage';

/**
 * EduPath durable production store.
 *
 * The app is deployed on Vercel, so application instances are stateless.
 * This module uses Neon PostgreSQL's HTTPS SQL endpoint directly. It keeps
 * the runtime dependency-free while still giving us durable, transactional
 * storage for registrations and other mutable records.
 *
 * Excel remains a reporting/export format. It is NOT the source of truth for
 * production registrations.
 */

const DATABASE_URL = process.env.DATABASE_URL?.trim();

export type ProductionStoreStatus = 'configured' | 'not-configured';

function requireDatabaseUrl(): string {
  if (!DATABASE_URL) {
    throw new Error(
      'EDUPATH_DATABASE_NOT_CONFIGURED: Set DATABASE_URL to a Neon/Postgres connection string before accepting production registrations.'
    );
  }
  return DATABASE_URL;
}

function databaseEndpoint(connectionString: string): string {
  const url = new URL(connectionString);
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must use postgres:// or postgresql://.');
  }
  return `https://${url.hostname}/sql`;
}

type NeonField = { name: string };
type NeonRawResult = {
  fields: NeonField[];
  rows: unknown[][];
};

type NeonBatchResponse = {
  results: NeonRawResult[];
};

class DatabaseError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
  status?: number;

  constructor(message: string, init?: Partial<DatabaseError>) {
    super(message);
    this.name = 'DatabaseError';
    Object.assign(this, init);
  }
}

function resultRows<T extends Record<string, unknown>>(result: NeonRawResult): T[] {
  return result.rows.map((row) => {
    const output: Record<string, unknown> = {};
    result.fields.forEach((field, index) => {
      output[field.name] = row[index];
    });
    return output as T;
  });
}

async function neonFetch(
  body: unknown,
  headers: Record<string, string>
): Promise<unknown> {
  const connectionString = requireDatabaseUrl();
  const response = await fetch(databaseEndpoint(connectionString), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': connectionString,
      'Neon-Raw-Text-Output': 'true',
      'Neon-Array-Mode': 'true',
      ...headers,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) {
    let payload: Record<string, unknown> = {};
    try {
      payload = (await response.json()) as Record<string, unknown>;
    } catch {
      // Keep the original HTTP status if the server didn't return JSON.
    }

    throw new DatabaseError(
      String(payload.message || `Database request failed (${response.status}).`),
      {
        code: typeof payload.code === 'string' ? payload.code : undefined,
        constraint:
          typeof payload.constraint === 'string' ? payload.constraint : undefined,
        detail: typeof payload.detail === 'string' ? payload.detail : undefined,
        status: response.status,
      }
    );
  }

  return response.json();
}

async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  sqlText: string,
  params: unknown[] = []
): Promise<T[]> {
  const raw = (await neonFetch(
    { query: sqlText, params },
    {}
  )) as NeonRawResult;

  return resultRows<T>(raw);
}

async function transaction(
  queries: Array<{ query: string; params?: unknown[] }>,
  isolationLevel: 'ReadCommitted' | 'RepeatableRead' | 'Serializable' = 'Serializable'
): Promise<NeonRawResult[]> {
  const raw = (await neonFetch(
    {
      queries: queries.map((item) => ({
        query: item.query,
        params: item.params || [],
      })),
    },
    {
      'Neon-Batch-Isolation-Level': isolationLevel,
      'Neon-Batch-Read-Only': 'false',
    }
  )) as NeonBatchResponse;

  if (!raw || !Array.isArray(raw.results)) {
    throw new DatabaseError('Database transaction returned an invalid response.');
  }

  return raw.results;
}

function parseJson<T>(value: unknown): T {
  if (typeof value === 'string') return JSON.parse(value) as T;
  return value as T;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
}

let schemaReady: Promise<void> | null = null;

export function productionDatabaseStatus(): ProductionStoreStatus {
  return DATABASE_URL ? 'configured' : 'not-configured';
}

export function assertProductionDatabase(): void {
  requireDatabaseUrl();
}

export async function ensureProductionSchema(): Promise<void> {
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    await transaction([
      {
        query: `
          CREATE TABLE IF NOT EXISTS edupath_records (
            id TEXT PRIMARY KEY,
            record_type TEXT NOT NULL,
            email TEXT,
            student_id TEXT,
            booking_date TEXT,
            time_slot TEXT,
            data JSONB NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `,
      },
      {
        query: `
          CREATE TABLE IF NOT EXISTS edupath_idempotency (
            operation_key TEXT PRIMARY KEY,
            response JSONB NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `,
      },
      {
        query: `
          CREATE UNIQUE INDEX IF NOT EXISTS edupath_student_email_unique
          ON edupath_records (record_type, LOWER(email))
          WHERE record_type = 'student'
        `,
      },
      {
        query: `
          CREATE UNIQUE INDEX IF NOT EXISTS edupath_demo_slot_unique
          ON edupath_records (record_type, booking_date, time_slot)
          WHERE record_type = 'demo' AND COALESCE(data->>'status', '') <> 'CANCELLED'
        `,
      },
      {
        query: `
          CREATE INDEX IF NOT EXISTS edupath_records_student_id_idx
          ON edupath_records (student_id)
        `,
      },
      {
        query: `
          CREATE INDEX IF NOT EXISTS edupath_records_type_created_idx
          ON edupath_records (record_type, created_at DESC)
        `,
      },
      {
        query: `
          CREATE INDEX IF NOT EXISTS edupath_records_email_idx
          ON edupath_records (email)
        `,
      },
    ]);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });

  return schemaReady;
}

export interface RegistrationBundle {
  student: StudentRecord;
  booking: DemoBookingRecord;
  lead: LeadRecord;
  counselling: CounsellingRecord;
}

export interface RegistrationResult {
  replayed: boolean;
  studentId: string;
  bookingId: string;
  leadId: string;
  response: Record<string, unknown>;
}

export async function getStudentByEmail(email: string): Promise<StudentRecord | null> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'student' AND LOWER(email) = LOWER($1) LIMIT 1`,
    [normalizeEmail(email)]
  );
  return rows[0] ? parseJson<StudentRecord>(rows[0].data) : null;
}

export async function getStudentById(studentId: string): Promise<StudentRecord | null> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'student' AND student_id = $1 LIMIT 1`,
    [studentId]
  );
  return rows[0] ? parseJson<StudentRecord>(rows[0].data) : null;
}

export async function updateStudentPassword(
  studentId: string,
  passwordHash: string
): Promise<StudentRecord | null> {
  await ensureProductionSchema();
  const student = await getStudentById(studentId);
  if (!student) return null;

  const updated = {
    ...student,
    passwordHash,
    updatedAt: new Date().toISOString(),
  };

  await query(
    `UPDATE edupath_records SET data = $1::jsonb, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(updated), studentId]
  );

  return updated;
}

export async function updateStudent(
  studentId: string,
  updates: Partial<StudentRecord>
): Promise<StudentRecord | null> {
  await ensureProductionSchema();
  const student = await getStudentById(studentId);
  if (!student) return null;

  const updated = {
    ...student,
    ...updates,
    studentId,
    updatedAt: new Date().toISOString(),
  };

  await query(
    `UPDATE edupath_records SET data = $1::jsonb, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(updated), studentId]
  );

  return updated;
}

export async function getStudentDemoBookings(studentId: string): Promise<DemoBookingRecord[]> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'demo' AND student_id = $1 ORDER BY created_at DESC`,
    [studentId]
  );
  return rows.map((row) => parseJson<DemoBookingRecord>(row.data));
}

export async function getStudents(): Promise<StudentRecord[]> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'student' ORDER BY created_at DESC`
  );
  return rows.map((row) => parseJson<StudentRecord>(row.data));
}

export async function getDemoBookings(): Promise<DemoBookingRecord[]> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'demo' ORDER BY created_at DESC`
  );
  return rows.map((row) => parseJson<DemoBookingRecord>(row.data));
}

export async function getLeads(): Promise<LeadRecord[]> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'lead' ORDER BY created_at DESC`
  );
  return rows.map((row) => parseJson<LeadRecord>(row.data));
}

export async function getCounsellingRecords(): Promise<CounsellingRecord[]> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'counselling' ORDER BY created_at DESC`
  );
  return rows.map((row) => parseJson<CounsellingRecord>(row.data));
}

export async function getNotificationLogs(): Promise<NotificationLogRecord[]> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'notification' ORDER BY created_at DESC LIMIT 500`
  );
  return rows.map((row) => parseJson<NotificationLogRecord>(row.data));
}

export async function getAuditLogs(): Promise<AuditLogRecord[]> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'audit' ORDER BY created_at DESC LIMIT 500`
  );
  return rows.map((row) => parseJson<AuditLogRecord>(row.data));
}

export async function addNotificationLog(log: NotificationLogRecord): Promise<void> {
  await ensureProductionSchema();
  await query(
    `INSERT INTO edupath_records (id, record_type, data, created_at, updated_at) VALUES ($1, 'notification', $2::jsonb, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
    [log.id, JSON.stringify(log)]
  );
}

export async function addAuditLog(log: AuditLogRecord): Promise<void> {
  await ensureProductionSchema();
  await query(
    `INSERT INTO edupath_records (id, record_type, data, created_at, updated_at) VALUES ($1, 'audit', $2::jsonb, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
    [log.id, JSON.stringify(log)]
  );
}

export async function getPendingSyncLeads(): Promise<LeadRecord[]> {
  const leads = await getLeads();
  return leads.filter((lead) => lead.sheetsSyncStatus === 'PENDING_SYNC' || lead.sheetsSyncStatus === 'FAILED');
}

export async function markLeadSynced(leadId: string): Promise<void> {
  await updateLeadStatus(leadId, undefined, undefined, undefined, { sheetsSyncStatus: 'SYNCED' });
}

export async function markLeadSyncFailed(leadId: string): Promise<void> {
  await updateLeadStatus(leadId, undefined, undefined, undefined, { sheetsSyncStatus: 'FAILED' });
}

export async function updateLeadStatus(
  leadId: string,
  status?: LeadRecord['status'],
  counsellor?: string,
  notes?: string,
  extra?: Partial<LeadRecord>
): Promise<LeadRecord | null> {
  await ensureProductionSchema();
  const rows = await query<{ id: string; data: string }>(
    `SELECT id, data FROM edupath_records WHERE record_type = 'lead' AND id = $1 LIMIT 1`,
    [leadId]
  );
  if (!rows[0]) return null;

  const lead = parseJson<LeadRecord>(rows[0].data);
  const updated: LeadRecord = {
    ...lead,
    ...(status ? { status } : {}),
    ...(counsellor !== undefined ? { counsellor } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(extra || {}),
  };

  await query(
    `UPDATE edupath_records SET data = $1::jsonb, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(updated), leadId]
  );
  return updated;
}

export async function updateDemoBooking(
  bookingId: string,
  updates: Partial<DemoBookingRecord>
): Promise<DemoBookingRecord | null> {
  await ensureProductionSchema();
  const rows = await query<{ id: string; data: string }>(
    `SELECT id, data FROM edupath_records WHERE record_type = 'demo' AND id = $1 LIMIT 1`,
    [bookingId]
  );
  if (!rows[0]) return null;

  const booking = parseJson<DemoBookingRecord>(rows[0].data);
  const updated = { ...booking, ...updates };
  await query(
    `UPDATE edupath_records SET data = $1::jsonb, updated_at = NOW(), booking_date = $2, time_slot = $3 WHERE id = $4`,
    [JSON.stringify(updated), updated.preferredDate, updated.preferredTimeSlot, bookingId]
  );
  return updated;
}

export async function getTimeSlots(): Promise<TimeSlotConfig[]> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'time_slot' ORDER BY created_at ASC`
  );

  if (rows.length) return rows.map((row) => parseJson<TimeSlotConfig>(row.data));

  const defaults: TimeSlotConfig[] = [
    ['10:00 AM - 11:00 AM', 'slot-10-11'],
    ['11:00 AM - 12:00 PM', 'slot-11-12'],
    ['12:00 PM - 1:00 PM', 'slot-12-1'],
    ['2:00 PM - 3:00 PM', 'slot-2-3'],
    ['3:00 PM - 4:00 PM', 'slot-3-4'],
    ['4:00 PM - 5:00 PM', 'slot-4-5'],
    ['5:00 PM - 6:00 PM', 'slot-5-6'],
    ['6:00 PM - 7:00 PM', 'slot-6-7'],
  ].map(([time, slotId]) => ({
    id: slotId,
    slotId,
    time,
    label: time,
    slot: time,
    timeSlot: time,
    capacity: 1,
    booked: 0,
    available: 1,
    enabled: true,
    active: true,
    blockedDates: [],
  }));

  await transaction(defaults.map((slot) => ({
    query: `INSERT INTO edupath_records (id, record_type, data, created_at, updated_at) VALUES ($1, 'time_slot', $2::jsonb, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
    params: [slot.id || slot.slotId, JSON.stringify(slot)],
  })));

  return defaults;
}

export async function updateTimeSlot(
  slotId: string,
  updates: Partial<TimeSlotConfig>
): Promise<TimeSlotConfig | null> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'time_slot' AND id = $1 LIMIT 1`,
    [slotId]
  );
  if (!rows[0]) return null;
  const current = parseJson<TimeSlotConfig>(rows[0].data);
  const updated = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  if (typeof updated.enabled === 'boolean') updated.active = updated.enabled;
  const capacity = Number(updated.capacity || 0);
  const booked = Number(updated.booked || 0);
  updated.available = Math.max(0, capacity - booked);

  await query(
    `UPDATE edupath_records SET data = $1::jsonb, updated_at = NOW() WHERE id = $2 AND record_type = 'time_slot'`,
    [JSON.stringify(updated), slotId]
  );
  return updated;
}


export async function addCustomTimeSlot(timeSlot: string, capacity = 1): Promise<TimeSlotConfig> {
  await ensureProductionSchema();
  const id = makeId('slot');
  const slot: TimeSlotConfig = {
    id,
    slotId: id,
    time: timeSlot,
    label: timeSlot,
    slot: timeSlot,
    timeSlot,
    capacity,
    booked: 0,
    available: capacity,
    enabled: true,
    active: true,
    blockedDates: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await query(
    `INSERT INTO edupath_records (id, record_type, data, created_at, updated_at) VALUES ($1, 'time_slot', $2::jsonb, NOW(), NOW())`,
    [id, JSON.stringify(slot)]
  );
  return slot;
}

export async function registerStudentBundle(
  bundle: RegistrationBundle,
  operationKey: string,
  response: Record<string, unknown>
): Promise<RegistrationResult> {
  await ensureProductionSchema();

  const existing = await query<{ response: string }>(
    `SELECT response FROM edupath_idempotency WHERE operation_key = $1 LIMIT 1`,
    [operationKey]
  );
  if (existing[0]) {
    const replay = parseJson<Record<string, unknown>>(existing[0].response);
    return {
      replayed: true,
      studentId: String(replay.studentId || bundle.student.studentId),
      bookingId: String(replay.bookingId || bundle.booking.bookingId),
      leadId: String(replay.leadId || bundle.lead.leadId),
      response: replay,
    };
  }

  const queries = [
    {
      query: `
        INSERT INTO edupath_records
          (id, record_type, email, student_id, data, created_at, updated_at)
        VALUES ($1, 'student', $2, $1, $3::jsonb, NOW(), NOW())
      `,
      params: [bundle.student.studentId, normalizeEmail(bundle.student.email), JSON.stringify(bundle.student)],
    },
    {
      query: `
        INSERT INTO edupath_records
          (id, record_type, email, student_id, booking_date, time_slot, data, created_at, updated_at)
        VALUES ($1, 'demo', $2, $3, $4, $5, $6::jsonb, NOW(), NOW())
      `,
      params: [
        bundle.booking.bookingId,
        normalizeEmail(bundle.booking.email),
        bundle.booking.studentId,
        bundle.booking.preferredDate,
        bundle.booking.preferredTimeSlot,
        JSON.stringify(bundle.booking),
      ],
    },
    {
      query: `
        INSERT INTO edupath_records
          (id, record_type, email, student_id, data, created_at, updated_at)
        VALUES ($1, 'lead', $2, $3, $4::jsonb, NOW(), NOW())
      `,
      params: [
        bundle.lead.leadId,
        normalizeEmail(bundle.lead.email),
        bundle.lead.studentId,
        JSON.stringify(bundle.lead),
      ],
    },
    {
      query: `
        INSERT INTO edupath_records
          (id, record_type, student_id, data, created_at, updated_at)
        VALUES ($1, 'counselling', $2, $3::jsonb, NOW(), NOW())
      `,
      params: [bundle.counselling.sessionId, bundle.counselling.studentId, JSON.stringify(bundle.counselling)],
    },
    {
      query: `
        INSERT INTO edupath_idempotency (operation_key, response, created_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (operation_key) DO NOTHING
      `,
      params: [operationKey, JSON.stringify(response)],
    },
  ];

  try {
    await transaction(queries, 'Serializable');
  } catch (error) {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505' && dbError.constraint === 'edupath_student_email_unique') {
      throw new DatabaseError('A student account with this email already exists.', {
        code: 'DUPLICATE_STUDENT_EMAIL',
      });
    }
    if (dbError.code === '23505' && dbError.constraint === 'edupath_demo_slot_unique') {
      throw new DatabaseError('The selected counselling slot has already been reserved.', {
        code: 'DUPLICATE_DEMO_SLOT',
      });
    }
    throw error;
  }

  return {
    replayed: false,
    studentId: bundle.student.studentId,
    bookingId: bundle.booking.bookingId,
    leadId: bundle.lead.leadId,
    response,
  };
}


export async function getCounsellors(): Promise<CounsellorRecord[]> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'counsellor' AND (data->>'active')::boolean = true ORDER BY created_at ASC`
  );

  if (rows.length) return rows.map((row) => parseJson<CounsellorRecord>(row.data));
  return [];
}

export async function getCounsellorById(counsellorId: string): Promise<CounsellorRecord | null> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT data FROM edupath_records WHERE record_type = 'counsellor' AND id = $1 LIMIT 1`,
    [counsellorId]
  );

  if (!rows[0]) return null;
  return parseJson<CounsellorRecord>(rows[0].data);
}

export async function createCounsellor(counsellor: Omit<CounsellorRecord, 'counsellorId' | 'createdAt'>): Promise<CounsellorRecord> {
  await ensureProductionSchema();
  const counsellorId = `COUN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const record: CounsellorRecord = {
    counsellorId,
    name: String(counsellor.name),
    email: String(counsellor.email),
    phone: String(counsellor.phone),
    specialization: String(counsellor.specialization),
    active: Boolean(counsellor.active),
    availability: counsellor.availability ? String(counsellor.availability) : undefined,
    createdAt: new Date().toISOString(),
  };

  await query(
    `INSERT INTO edupath_records (id, record_type, data, created_at) VALUES ($1, 'counsellor', $2::jsonb, NOW())`,
    [counsellorId, JSON.stringify(record)]
  );

  return record;
}

export async function updateCounsellor(
  counsellorId: string,
  updates: Partial<CounsellorRecord>
): Promise<CounsellorRecord | null> {
  await ensureProductionSchema();
  const rows = await query<{ data: string }>(
    `SELECT id, data FROM edupath_records WHERE record_type = 'counsellor' AND id = $1 LIMIT 1`,
    [counsellorId]
  );
  if (!rows[0]) return null;

  const counsellor = parseJson<CounsellorRecord>(rows[0].data);
  const updated = { ...counsellor, ...updates, updatedAt: new Date().toISOString() };
  await query(
    `UPDATE edupath_records SET data = $1::jsonb, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(updated), counsellorId]
  );
  return updated;
}

export async function getDashboardData() {
  const [students, demos, leads, notifications, auditLogs, timeSlots] = await Promise.all([
    getStudents(),
    getDemoBookings(),
    getLeads(),
    getNotificationLogs(),
    getAuditLogs(),
    getTimeSlots(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const todayRegistrations = students.filter((student) => String(student.registrationDate || '').slice(0, 10) === today).length;
  const todayBookings = demos.filter((booking) => String(booking.registrationDate || '').slice(0, 10) === today).length;
  const activeBookings = demos.filter((booking) => !['CANCELLED', 'COMPLETED'].includes(booking.status)).length;
  const completedBookings = demos.filter((booking) => booking.status === 'COMPLETED').length;
  const cancelledBookings = demos.filter((booking) => booking.status === 'CANCELLED').length;
  const pendingSyncCount = leads.filter((lead) => lead.sheetsSyncStatus === 'PENDING_SYNC' || lead.sheetsSyncStatus === 'FAILED').length;

  return {
    stats: {
      totalStudents: students.length,
      totalDemoBookings: demos.length,
      activeDemoBookings: activeBookings,
      completedDemoBookings: completedBookings,
      cancelledDemoBookings: cancelledBookings,
      totalLeads: leads.length,
      pendingSyncCount,
      totalNotifications: notifications.length,
      todayRegistrations,
      todayBookings,
    },
    students,
    demoBookings: demos,
    leads,
    notifications: notifications.slice(0, 50),
    auditLogs: auditLogs.slice(0, 50),
    timeSlots,
  };
}

export function isProductionDatabaseError(error: unknown, code: string): boolean {
  return error instanceof DatabaseError && error.code === code;
}

export function isDatabaseNotConfiguredError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('EDUPATH_DATABASE_NOT_CONFIGURED:');
}

export { makeId };
