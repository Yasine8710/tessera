# API

Tessera exposes its operations in two ways, both backed by the same service layer (`src/server/services/*`)
and the same authorization rules.

1. **Web (server actions)** in `src/app/actions/*`, used by the Next.js UI. Cookie session, origin-checked.
2. **REST v1** in `src/app/api/v1/*` for non-browser clients (future iOS/Android). Bearer session token.

All v1 responses are JSON: `{ "data": ... }` on success or `{ "error": { "code", "message" } }` on failure.

| HTTP | `error.code` | Meaning |
|---|---|---|
| 400 | `INVALID` | Validation failed. |
| 401 | `UNAUTHENTICATED` | Missing/invalid token or bad credentials. |
| 403 | `FORBIDDEN` | Authenticated but not allowed (role, consent, suspended). |
| 404 | `NOT_FOUND` | Missing **or not visible to you** (prevents ID probing). |
| 409 | `CONFLICT` | State conflict (e.g. invitation already used). |
| 429 | `RATE_LIMITED` | Too many attempts. |

## Authentication

`POST /api/v1/auth/login` `{ "email", "password" }` → `{ token, expiresAt, role }`.
Send `Authorization: Bearer <token>` on every other call. Tokens are opaque, expire after 14 days, and are
revoked by `POST /api/v1/auth/logout`, a password reset, or account suspension. Store them in the platform
keychain/keystore on devices, never in plain preferences.

## Endpoints

| Method & path | Role | Description |
|---|---|---|
| `GET /api/v1/me` | any | Current actor (role, timezone, profile ids). |
| `GET /api/v1/doses` | patient | Doses from 1 day ago to 1 day ahead with effective status (`SCHEDULED`/`TAKEN`/`SKIPPED`/`MISSED`). |
| `POST /api/v1/doses/report` | patient | `{ intakeId, status: "TAKEN"\|"SKIPPED", takenAt?, note? }`. Patients cannot report `MISSED` or future doses. |
| `GET /api/v1/notifications` | any | `{ unread, items }`. |
| `POST /api/v1/notifications/read` | any | `{ id? }` marks one (or all) read. |
| `GET /api/v1/conversations` | patient, professional | Conversations with unread counts. |
| `GET /api/v1/conversations/:id/messages?before=` | participant | Messages (marks read). |
| `POST /api/v1/conversations/:id/messages` | participant | `{ body }`; requires an active care relationship. |
| `GET /api/v1/patients?q=&page=` | professional | Paginated directory of actively linked patients. |

Operational endpoints: `GET /api/health`, `POST /api/cron/reminders` (Bearer `CRON_SECRET`),
`GET /api/account/export` (cookie session; JSON download of your own data).

## Example

```bash
TOKEN=$(curl -s localhost:3000/api/v1/auth/login -H 'content-type: application/json' \
  -d '{"email":"demo.patient@tessera.invalid","password":"DemoPassw0rd!"}' | jq -r .data.token)
curl -s localhost:3000/api/v1/doses -H "authorization: Bearer $TOKEN"
```

(The demo account exists only after `npm run db:seed` and contains synthetic data.)

## Guidance for future mobile clients

- Reuse REST v1; add endpoints by wrapping an existing service function with `apiActor` + `handle` (see any route in `src/app/api/v1`). Never reimplement business rules in the client.
- Extend v1 for care plans, routines, appointments, journal and measurements the same way; the services already exist.
- Push notifications: add a device-token table and a transport behind the notification layer (`notify()` in `src/server/services/notifications.ts`); keep message content out of push payloads.
- Consider short-lived access tokens with refresh tokens before shipping a public mobile app (current tokens are 14-day opaque sessions).
- Use certificate pinning and secure storage; do not log request bodies on device.
- Version the API in the path (`/api/v2`) for breaking changes.
