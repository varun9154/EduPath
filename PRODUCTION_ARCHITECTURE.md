# EduPath Production Architecture

## Runtime

- Next.js 14 App Router on Vercel
- Stateless API routes
- Signed stateless student/admin sessions
- No production reliance on the Vercel `/tmp` filesystem

## Data

### Primary source of truth

Neon PostgreSQL (`DATABASE_URL`) stores:

- Students
- Demo bookings
- Leads
- Counselling records
- Notification logs
- Audit logs
- Time slots
- Registration idempotency records

The database schema is intentionally JSONB-backed so the current EduPath record shape can evolve without a destructive migration of every optional student field.

### Excel

Excel remains part of EduPath because it is useful to the admin/business workflow:

- Admin export
- Reporting
- Legacy course purchase/progress compatibility

It is no longer the authoritative production registration store.

## Registration transaction

```text
POST /api/register
      |
      +--> validate input
      |
      +--> validate idempotency key
      |
      +--> SERIALIZABLE transaction
      |      |
      |      +--> student
      |      +--> demo booking
      |      +--> lead
      |      +--> counselling record
      |      +--> idempotency result
      |
      +--> commit
      |
      +--> email / WhatsApp / SMS dispatch
      |
      +--> signed student session cookie
```

Notification delivery is deliberately outside the persistence transaction. A provider outage cannot delete or roll back a valid registration.

## Concurrency controls

- Unique student email index
- Unique active demo-slot index
- Serializable registration transaction
- Idempotency record
- Stateless signed session token
- Vercel Blob optimistic concurrency for remaining Excel compatibility paths

## Failure isolation

```text
Database success + Email failure      => registration remains successful
Database success + WhatsApp failure   => registration remains successful
Database success + SMS failure        => registration remains successful
Database unavailable                  => registration returns controlled 503
Excel unavailable                     => registration does not depend on Excel
```

## 500-user test

The repository contains `scripts/load-test-registration.mjs` and the npm command:

```bash
npm run loadtest:registration
```

Use a staging deployment and test mailbox/domain before running hundreds of registrations.
