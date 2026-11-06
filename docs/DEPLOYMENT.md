# Deployment

Tessera is a standard Node 20+ Next.js app plus PostgreSQL 14+. **Costs are yours:** hosting, database,
backups, email and monitoring are paid by whoever operates the instance. Tessera itself charges nothing and
has no billing system. Provider free tiers (if any) are limited and change; do not assume unlimited capacity.

## 1. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string. |
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

## 4. Docker (self-hosted example)

Use `docker-compose.yml` for the database in development. For production, run Postgres on a managed service or a
hardened host, put the app behind a TLS-terminating reverse proxy that sets `X-Forwarded-For`, and restrict
database access to the app's network.

## 5. Backups and recovery

```bash
pg_dump --format=custom "$DATABASE_URL" > caresync-$(date +%F).dump
pg_restore --clean --dbname "$NEW_DATABASE_URL" caresync-YYYY-MM-DD.dump
```

Automate daily dumps, encrypt and store them off-host, and rehearse a restore. See
[PRIVACY_AND_SECURITY.md](PRIVACY_AND_SECURITY.md) for the full production checklist.

## 6. Health check

`GET /api/health` returns `{ "status": "ok" }` when the app can reach the database.
