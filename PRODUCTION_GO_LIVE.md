# EduPath Production Go-Live Runbook

## 1. Source of truth

Production registrations no longer depend on `/tmp/edupath-excel/edupath.xlsx`.

- **Primary source of truth:** Neon PostgreSQL via `DATABASE_URL`.
- **Excel:** admin reporting/export plus legacy course-progress compatibility.
- **Vercel `/tmp`:** temporary working area only; never treated as durable storage.

The registration transaction persists the student, demo booking, lead and counselling record together. A duplicate email or occupied demo slot is rejected by database uniqueness constraints. A repeated request with the same `Idempotency-Key` reuses the stored registration result.

## 2. Vercel services

Connect a Neon PostgreSQL integration to the Vercel project and create a **private** Vercel Blob store for the remaining Excel-based compatibility/reporting paths.

Required production environment variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `BLOB_READ_WRITE_TOKEN`
- SMTP variables
- WhatsApp variables
- AI provider variables as required

## 3. Database initialization

The application automatically creates its required tables and indexes on first database-backed request. You can also run `PRODUCTION_DATABASE.sql` in the Neon SQL editor before the first deployment.

## 4. Local validation

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

## 5. Production smoke tests

After deployment:

```text
GET /api/health
POST /api/register
POST /api/auth/student
GET /api/student/dashboard
GET /api/student/profile
GET /api/student/demos
GET /api/admin
GET /api/admin/export-excel
POST /api/ai-counsellor
```

Registration must be tested with a real staging email/mobile and must be verified in the Neon database, not only in the Excel export.

## 6. Load test

Run only against staging/test data:

```bash
LOAD_TEST_BASE_URL=https://your-staging.vercel.app LOAD_TEST_COUNT=500 LOAD_TEST_CONCURRENCY=100 npm run loadtest:registration
```

Do not run this against the public production site unless the test records and notification providers are intentionally isolated.

## 7. Acceptance criteria

- No registration data is lost when email/WhatsApp is unavailable.
- Duplicate registration does not create a second student.
- Two simultaneous requests cannot book the same active demo slot.
- Student login works across different Vercel function instances because the session token is stateless/signed.
- Admin export reads the durable production records and generates Excel on demand.
- `/tmp` is never the production source of truth.
