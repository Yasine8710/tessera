# Privacy and Security

> Tessera makes **no claim of HIPAA, GDPR or any other regulatory compliance**. Implemented controls help,
> but compliance depends on how and where it is operated. Obtain qualified legal and security review for your
> jurisdiction before handling real patient data.

## Implemented controls

| Area | Control |
|---|---|
| Passwords | scrypt (N=32768, r=8, p=1), per-user salt, constant-time compare, 10+ characters. |
| Sessions | Random 256-bit opaque token; only its SHA-256 hash stored; `httpOnly`, `SameSite=Lax`, `Secure` in production; 14-day expiry; revoked on logout, password reset and suspension. |
| CSRF | `SameSite=Lax` cookie plus Next.js server-action origin checks; state changes are never GET. |
| Authorization | Enforced in the service layer on every operation: role, active care relationship, per-category consent. Admins have no clinical access. |
| Enumeration | Login error is identical for unknown email and wrong password; password-reset response is identical; unauthorized patient lookups return not-found. |
| Rate limiting | Database-backed fixed windows on login (per IP and per email), registration and password reset. |
| Invitations | 256-bit random token, only the hash is stored, 7-day expiry, bound to the invited email, atomically single-use (tested under concurrency), revocable. |
| Staff verification | Professionals register as `PENDING_APPROVAL` and have no staff access until an administrator approves. The role is never read from client input. There is no public admin route; admins are created with `npm run admin:create`. |
| Audit | Who / what / when for sign-in, registration, invitations, relationship and consent changes, care-plan and medication changes, dose reports, exports, admin actions. Message bodies, notes, passwords and tokens are never logged. |
| Headers | CSP, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, restrictive permissions policy, HSTS in production, `no-store` on authenticated routes. |
| Exports | CSV includes only patients who consented to adherence sharing, no emails, with spreadsheet-formula neutralisation. Users can download their own data as JSON. |
| Deletion | Account closure ends sessions and relationships and removes personal identifiers. Clinical entries may be retained de-identified where retention law requires; the operator must define the retention policy. |

## Safety boundaries (by design)

- No diagnosis, no medication prescribing, no automatic dose changes. Patients can only *request* a change.
- Patient entries are labelled *reported by patient*. Monitoring flags are configurable workflow indicators, not predictions.
- Messaging is not an emergency service; the UI repeats this.

## Production requirements (operator checklist)

1. Serve over HTTPS only (terminate TLS at the proxy or platform); set `APP_URL` to the https origin.
2. Generate fresh `APP_SECRET` and `CRON_SECRET`; never reuse the example values. Set `DEMO_MODE=false`.
3. Keep the database encrypted at rest (the desktop app uses SQLCipher with a key held in Windows DPAPI) and restrict access to the data folder.
4. **Backups:** daily `pg_dump` (or provider snapshots) with point-in-time recovery if available; encrypt backups; **test a restore** regularly; document RPO/RTO.
5. Configure a real mail transport (see [DEPLOYMENT.md](DEPLOYMENT.md)); until then the UI states that email was not delivered.
6. Run the reminder job on a schedule (see DEPLOYMENT.md).
7. Centralize logs without sensitive content; alert on repeated `auth.login_failed` audit events.
8. Run dependency audits (`npm audit`) in CI and keep Node, Next.js and Electron patched.
9. Obtain legal review (data-protection law, medical-records retention, consent wording, terms, privacy policy) and an independent penetration test before onboarding real patients.

## Known limitations

- No multi-factor authentication yet.
- No email delivery or push transport is bundled; an adapter interface exists (`src/server/mail.ts`).
- Rate limiting keys on the `X-Forwarded-For` header; configure your proxy to set it and strip client-supplied values.
- No antivirus/file-upload surface exists because uploads are not implemented.
- Database-level encryption of individual columns is not implemented.
