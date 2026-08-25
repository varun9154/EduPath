# EduPath Production Deployment Runbook

## 1. Install

```bash
npm ci
```

## 2. Local verification

```bash
npm run lint
npm run typecheck
npm run build
```

## 3. Vercel storage

Create a **Private Vercel Blob** store and connect it to the EduPath project. Vercel will expose `BLOB_READ_WRITE_TOKEN` to the selected environments.

Set these Production variables:

- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://YOUR-DOMAIN`
- `ADMIN_EMAIL=edupathadmin@gmail.com`
- `ADMIN_PASSWORD=<strong password>`
- `AUTH_SECRET=<32+ random characters>`
- `BLOB_READ_WRITE_TOKEN=<private blob token>`
- `EDUPATH_EXCEL_BLOB_PATH=edupath/edupath.xlsx`
- SMTP variables
- WhatsApp variables
- SMS variables if enabled

## 4. Preview first

Deploy a Preview and test:

1. Home page
2. Student registration
3. Student login
4. Onboarding
5. Recommended courses
6. Roadmap
7. Course purchase
8. Course progress
9. Demo booking
10. Admin login
11. Admin dashboard
12. Time-slot management
13. Excel export
14. Email notification
15. WhatsApp notification

## 5. Production

Only promote the Preview after the complete smoke test succeeds.

## 6. Important data rule

Never create the Excel Blob store as public. The workbook contains student PII and credentials. Use a private Blob store.
