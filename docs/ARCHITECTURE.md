# Architecture

## Layers

```
src/app/**            Next.js routes: server components (read) + server actions (write). Thin.
src/app/api/**        Route handlers (cron, exports, REST v1 for future clients).
src/components/**     UI. Never imports the database.
src/server/services/  Business operations. EVERY function takes an Actor and enforces authorization.
src/server/access.ts  Central authorization: roles, care relationships, per-category consent.
src/domain/**         Pure rules (schedule expansion, intake status, appointment transitions...). No I/O.
src/lib/schemas.ts    Zod validation shared by forms and services.
prisma/               Schema + migrations (SQLite; SQLCipher-encrypted in the desktop app).
```

Rule of thumb: **the UI can be replaced (a mobile app, a CLI) without touching business rules**, because
`services/*` takes plain input and an `Actor` and returns data or throws `AppError`.

## Request flow (write)

1. Client component calls a server action (`src/app/actions/*`).
2. `act()` resolves the session from the httpOnly cookie on the server (never from client input).
3. The action calls a service with the `Actor` (`userId`, `role`, `patientId` / `professionalId`).
4. The service validates input (Zod), checks authorization (`assertPatientAccess`, `requireProfessional`...),
   performs the change in a transaction where several rows must stay consistent, then writes an audit event.
5. `AppError` becomes a safe message; unexpected errors are logged by class name only and shown generically.

## Authorization model

| Actor | Can access |
|---|---|
| Patient | Only their own records. |
| Professional (admin-approved) | A patient only while a `CareRelationship` is `ACTIVE`; then only the data categories the patient consented to (`JOURNAL`, `MEASUREMENTS`, `ROUTINES`, `MEDICATION_ADHERENCE`). Care plans they author are always visible to them. |
| Administrator | Accounts, approvals, organizations, audit log, settings. **No clinical-record access.** |

Unauthorized and nonexistent patients both return `NOT_FOUND` so identifiers cannot be probed. IDs are
random CUIDs; there are no public profile URLs.

## Key design decisions

- **Own session layer instead of Auth.js.** Auth.js credentials login only supports JWT sessions, which cannot be
  revoked server-side. Tessera stores a SHA-256 hash of a random opaque token in `Session`, so sign-out,
  password reset and suspension take effect immediately, and the same tokens can authenticate a future mobile client.
- **scrypt** (Node built-in, N=2^15) for password hashing: no native dependency to compile.
- **Database-backed rate limiting** (one `RateLimit` table) needs no Redis; the app is a single local process.
- **Dose records are materialized rows** (`MedicationIntake`, unique on plan + scheduled instant). Schedules are
  expanded in the patient's IANA time zone (`@date-fns/tz`), so DST changes neither shift nor duplicate doses and
  repeated job runs are idempotent. A scheduled dose with no report becomes *Missed* only after a grace period,
  and patients can only report *Taken* or *Skipped*.
- **Care-plan versioning:** each change to a plan or its medications bumps `version` and stores a snapshot with a
  mandatory reason and author in `CarePlanVersion`. Patients can only *request* a change (`MedicationChangeRequest`).
- **Notifications are deduplicated** by a unique `(userId, dedupeKey)` index with deterministic keys, so retried
  jobs never create duplicates. Message content is never copied into notifications.
- **Consent is data, not UI:** the check happens in the service/query layer, so direct API calls cannot bypass it.

## Data model (summary)

`User` (role, status) → `PatientProfile` / `ProfessionalProfile`; `CareRelationship` (+ `Consent` per category) links
them; `Invitation` (hashed single-use token); `CarePlan` → `CarePlanVersion`, `MedicationPlan` → `MedicationIntake`,
`RoutineDefinition` → `RoutineCompletion`; `Appointment`; `JournalEntry`; `Measurement`; `Conversation` →
`ConversationParticipant`, `Message`; `Notification` (+ preferences); `FollowUpTask`; `InternalNote` (staff only);
`AuditEvent`; `Organization`/`OrgMembership`; `AppSetting`; `RateLimit`; `Session`; `AuthToken`.
See `prisma/schema.prisma` for the authoritative definition.

## Future mobile clients

The same services can be exposed to native apps through the REST layer in `src/app/api/v1` (see [API.md](API.md)):
bearer session tokens, JSON in/out, the same `Actor`-based authorization. No mobile code is in scope for this version.
