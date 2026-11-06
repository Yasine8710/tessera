# Security Policy

Tessera handles health-related information. We take vulnerability reports seriously.

## Reporting a vulnerability

**Do not open a public issue.** Report privately through GitHub:
<https://github.com/Yasine8710/tessera-healthcare-platform/security/advisories/new>

Include the affected route or operation, steps to reproduce, and impact. Never include real patient data
in a report; use the synthetic demo data.

We aim to acknowledge reports within 5 working days. This is a volunteer-maintained project, not a
commercial service, and no response-time guarantee is offered.

## Scope

In scope: authentication and session handling, authorization (role and care-relationship checks),
consent enforcement, invitation tokens, messaging, exports, audit logging, and injection / XSS / CSRF issues.

Out of scope: vulnerabilities in third-party hosting you configure, social engineering, and denial of
service through volumetric traffic.

## Supported versions

Only the latest `main` is supported. The project is pre-1.0 and has **not** had an independent security
audit or penetration test. See [docs/PRIVACY_AND_SECURITY.md](docs/PRIVACY_AND_SECURITY.md) for the
implemented controls and production requirements.

## Operator responsibilities

Anyone deploying Tessera with real patient data is responsible for jurisdiction-specific legal
compliance (for example HIPAA, GDPR or national health-data law), a qualified security review, HTTPS,
backups, and incident response. This repository makes no compliance claims.
