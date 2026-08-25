# EduPath Production Architecture

## Production architecture

```text
Browser
  |
  v
Vercel CDN / Next.js App Router
  |
  +--> Public UI
  |
  +--> Server Route Handlers (Node.js)
          |
          +--> Stateless HMAC authentication cookies
          |
          +--> Excel domain services
          |      |
          |      +--> XLSX workbook in /tmp per invocation
          |      +--> Private Vercel Blob persistence
          |      +--> ETag optimistic concurrency + merge retry
          |
          +--> Email provider
          +--> WhatsApp provider
          +--> SMS provider
```

## Data policy

- Excel/XLSX is the application data format.
- No SQL/NoSQL/StringConnect database is used.
- Student data is stored in a **private** Blob object in production.
- Never use a public Blob store for student records.
- Vercel's filesystem is treated as temporary cache only.

Vercel documents private Blob storage for sensitive data and recommends private access for user data. It also documents conditional writes with ETags for concurrent updates.

## Concurrency

Every request hydrates the latest workbook into temporary storage before operating on it. Writes use an ETag. If another Vercel instance changed the workbook first, the write is retried after merging record-level changes by stable IDs.

This is appropriate for the initial 500-student pilot, but XLSX remains a file-oriented datastore. If transaction volume becomes much higher, a database should be reconsidered even if Excel remains the export/reporting format.

## Authentication

- Admin and student sessions are signed, HttpOnly cookies.
- Secrets are never hard-coded for production.
- Passwords are stored as bcrypt hashes.
- API route handlers perform authentication directly.
- Middleware is not used as the security boundary.

## Notifications

Registration triggers:

1. Student email
2. Admin email to `edupathadmin@gmail.com`
3. Student WhatsApp when configured
4. Student SMS when configured

Notification failures are logged and do not invalidate an already persisted registration.

## Required Vercel setup

1. Create a **Private** Vercel Blob store.
2. Connect it to the production project.
3. Ensure `BLOB_READ_WRITE_TOKEN` is available in Production.
4. Add the environment variables from `.env.example`.
5. Deploy a Preview first.
6. Test registration, login, onboarding, course recommendation, demo booking, purchase/progress, admin dashboard and Excel export.
7. Promote the tested build to Production.

## Important limitation

No software can honestly guarantee zero failures. The architecture is designed to fail safely, avoid local-disk durability assumptions, protect private data and preserve Excel updates under normal concurrent load.
