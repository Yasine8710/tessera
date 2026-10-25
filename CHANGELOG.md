# Changelog

All notable changes are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Public landing page, registration, login, password reset, email verification flow.
- Patient portal: medications and dose records, routines, appointments, health journal and measurements, progress, care plan, care team and per-category consent.
- Staff portal: patient directory and profiles, versioned care plans, medication schedules, monitoring, appointments, tasks, internal notes, reports with CSV export, invitations.
- Administration: professional approval, user suspension, organizations, audit log, platform health, settings.
- Messaging and in-app notifications with an idempotent reminder job.
- PostgreSQL schema with migrations, synthetic seed data, controlled admin bootstrap command.
- Unit, integration and end-to-end tests; GitHub Actions CI.
