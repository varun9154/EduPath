-- EduPath Production Database
-- Neon PostgreSQL / PostgreSQL 14+
-- The application also creates these objects automatically on first request.

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
);

CREATE TABLE IF NOT EXISTS edupath_idempotency (
  operation_key TEXT PRIMARY KEY,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS edupath_student_email_unique
  ON edupath_records (record_type, LOWER(email))
  WHERE record_type = 'student';

CREATE UNIQUE INDEX IF NOT EXISTS edupath_demo_slot_unique
  ON edupath_records (record_type, booking_date, time_slot)
  WHERE record_type = 'demo' AND COALESCE(data->>'status', '') <> 'CANCELLED';

CREATE INDEX IF NOT EXISTS edupath_records_student_id_idx
  ON edupath_records (student_id);

CREATE INDEX IF NOT EXISTS edupath_records_type_created_idx
  ON edupath_records (record_type, created_at DESC);

CREATE INDEX IF NOT EXISTS edupath_records_email_idx
  ON edupath_records (email);
