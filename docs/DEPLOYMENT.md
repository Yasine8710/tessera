# Deployment

Tessera is a Node 20+ Next.js app with a local SQLite database. The supported way to run it is the Windows desktop app (see README); this page covers running the web build on one machine. **Costs are yours:** hosting, database,
backups, email and monitoring are paid by whoever operates the instance. Tessera itself charges nothing and
has no billing system. Provider free tiers (if any) are limited and change; do not assume unlimited capacity.

## 1. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | SQLite file URL, for example `file:./dev.db` (relative paths resolve against `prisma/`). |
| `APP_URL` | yes | Public https origin (used in emailed links, metadata). |
| `APP_SECRET` | yes | Random 32+ bytes (`openssl rand -hex 32`). Reserved for token HMAC. |
| `CRON_SECRET` | yes | Bearer secret for `POST /api/cron/reminders`. |
| `DEMO_MODE` | no | `true` enables synthetic demo logins. **Keep `false` in production.** |
| `SMTP_URL`, `MAIL_FROM` | no | Mail transport. Without a transport, mails are printed to the server log and the UI says so. |
| `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_GITHUB_URL` | no | Shown in the footer when set. |

## 2. Build and run

```bash
npm ci
npm run db:deploy      # prisma migrate deploy (non-interactive)
npm run build
npm start              # listens on :3000
```

Create the first administrator (there is no public admin signup):

```bash
ADMIN_EMAIL=you@yourdomain.org ADMIN_PASSWORD='a-long-unique-passphrase' npm run admin:create
```

## 3. Scheduled reminders

Reminders, missed-dose marking and appointment/task alerts run server-side via an idempotent endpoint; they do
not depend on any browser being open. Call it every 5 minutes from any scheduler:

```bash
curl -fsS -X POST https://your.host/api/cron/reminders -H "Authorization: Bearer $CRON_SECRET"
```

Options: system cron, a GitHub Actions `schedule`, Vercel Cron, Render/Fly cron, or Kubernetes `CronJob`.
Retries are safe: notifications are deduplicated by deterministic keys.

## 4. Running the web build

The web build is a single Node process with one SQLite file, so run exactly one instance and keep the file on local
disk (not a network share). Put it behind a TLS-terminating reverse proxy that sets `X-Forwarded-For`, and keep the
database file readable only by the service account. For a clinic, the Windows desktop app is the supported setup.

## 5. Backups and recovery

Desktop: File, Back up data. Web: stop writes, then copy the database file (`prisma/*.db`, or the path in
`DATABASE_URL`) after a `PRAGMA wal_checkpoint(TRUNCATE)`. A backup of an encrypted database stays encrypted and is
useless without its key, so store the key separately.

Automate daily dumps, encrypt and store them off-host, and rehearse a restore. See
[PRIVACY_AND_SECURITY.md](PRIVACY_AND_SECURITY.md) for the full production checklist.

## 6. Health check

`GET /api/health` returns `{ "status": "ok" }` when the app can reach the database.
