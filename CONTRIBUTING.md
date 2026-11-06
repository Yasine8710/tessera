# Contributing to Tessera

Thanks for helping. Tessera is a coordination tool, not a diagnostic or prescribing tool; contributions
must keep it that way.

## Setup

```bash
npm install
cp .env.example .env
npm run db:up          # PostgreSQL 16 via Docker on port 5433
npm run db:deploy      # apply migrations
npm run db:seed        # synthetic demo data
npm run dev
```

## Before opening a pull request

```bash
npm run lint
npm run typecheck
npm test               # unit + integration (needs the database running)
npm run test:e2e       # Playwright (builds and starts the app)
```

## Ground rules

1. **Authorization lives in `src/server/services/*`.** UI and server actions are thin; every service
   function must check the actor (role, care relationship, consent) itself. Add a test for each new
   access rule, including the denial case.
2. **Domain rules are pure.** Put scheduling and status logic in `src/domain/*` with unit tests.
3. **No real health data**, ever: not in code, fixtures, screenshots, issues or logs. Use `.invalid` email addresses.
4. **Audit events store IDs and types only.** Never message bodies, notes, passwords or tokens.
5. **No clinical decision features.** No diagnosis, no automatic dosage or prescription changes.
6. **Schema changes need a migration** (`npx prisma migrate dev --name <change>`) committed with the PR.
7. **Accessibility:** keyboard operable, visible focus, labelled controls, works at 375px width.

## Commit style

One line, past tense: `Added: <what> (<metrics>). <key detail>.`
