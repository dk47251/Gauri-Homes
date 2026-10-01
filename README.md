# Gauri Home Management

Colony / RWA management app — Next.js 16 (App Router) + Tailwind CSS v4 + Prisma 7 + SQLite.
Converted from the offline Vite + Dexie (IndexedDB) app at `../simpleghmp`; all data now lives in SQLite.

## Setup

```bash
npm install            # also runs `prisma generate`
npx prisma migrate dev # creates/updates prisma/dev.db
npm run dev            # http://localhost:3000
```

Production: `npx prisma migrate deploy && npm run build && npm start`.

`DATABASE_URL` in `.env` points to the SQLite file (default `file:./prisma/dev.db`).

## Login & registration

Every screen, Server Action and API route requires a logged-in user.

- **Administrator account** comes from `.env` (`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`). It is created/updated on
  server start (`src/instrumentation.ts`) and before every login (`src/lib/auth/system-admin.ts`), so editing `.env`
  is all that's needed to change the email or password. It is marked "System" and cannot be edited from the UI.
- **Approval:** new registrations are `PENDING` and cannot log in until the administrator clicks *Approve* in
  *Users → List*. The **Users menu and all user management** (approve, reject/disable, roles, access, delete) are
  available to the `.env` administrator only; other users don't see the menu and `/users` redirects to the dashboard.
  The **Settings** menu and page are administrator-only in the same way.
- **Permissions:** each user has **Read & Write** or **Read Only** access (new users start as Read Only). Only the
  system administrator can change it (Access column in *Users → List*). Read Only users can view everything, preview
  documents, download reports and send WhatsApp reminders, but cannot create, edit, delete, download/restore backups or
  change settings (the Backup & Restore menu is hidden for them). This is enforced on the server (`requireWriteAccess()` in every Server Action via `runAction`, and in the
  restore API); the UI hides those controls and opens records in a view-only modal.

- Passwords are hashed with scrypt (Node `crypto`); sessions are stored in the `Session` table and the
  browser only gets a random token in an HttpOnly cookie (`ghm_session`, 7 days).
- `src/proxy.ts` redirects visitors without a session cookie to `/login?next=…` (optimistic check only);
  the real check is `requireUser()` / `getCurrentUser()` in `src/lib/auth/session.ts`, used by every query,
  Server Action (`runAction`) and API route.
- Failed logins are limited to 5 per email per 15 minutes (in-memory).
- `.env` options: `ALLOW_REGISTRATION="false"` closes sign-ups once your accounts exist;
  `COOKIE_SECURE="false"` is needed only if production is served over plain HTTP.

## Features

Dashboard · Houses & Members (member account, ID proofs, payment ledger) · RWA Members · Renters / Tenants ·
Monthly Maintenance · Payment Records (regular + advance) · Pending Payments with WhatsApp reminders ·
Expenses (recurring, bill uploads) · Reports (PDF / Excel) · Complete ZIP Backup & Restore · Settings.

Uploaded files (photos, ID proofs, bills) are stored in the `Document` table inside SQLite and served
from `/api/documents/[id]`.

**Migrating old data:** open *Backup & Restore* in the old offline app, create a backup ZIP, then restore that
ZIP here — the old format (documents embedded as data URLs) is supported, and record IDs are preserved.

## Structure

```
prisma/schema.prisma            Database models (House, Member, Payment, Expense, RwaMember, Renter, Document, Setting)
src/app/layout.tsx              Root layout (font, metadata)
src/app/(dashboard)/layout.tsx  App shell (sidebar + header) for all screens
src/app/(dashboard)/<route>/    page.tsx (Server Component, loads data) + _components/ (client views & modals)
src/app/api/backup              GET = download ZIP, POST = restore ZIP
src/app/api/documents/[id]      Serves uploaded files
src/components/ui               Shared UI (Button, Field/Input, Modal, Table, DocViewer, MonthPicker…)
src/components/layout           App shell & navigation
src/lib/actions                 Server Actions (create / update / delete), validated with zod
src/lib/data                    Server-only queries, ledger rows, monthly report
src/lib/ledger.ts               Maintenance ledger (pending carry-forward, advance credits)
src/lib/backup.ts               ZIP backup / restore
```

Month-based screens (Maintenance, Pending, Reports) keep the selected month in the URL (`?month=YYYY-MM`).
