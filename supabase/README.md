# Supabase setup

Run `setup.sql` as one transaction for a new installation or an upgrade. It includes the current versioned migrations and repeatable question/topic seed. See the root README for release sequencing, environment variables, and Auth redirect configuration.

`schema.sql` contains the complete schema without question seeding. Do not execute `migrations/001_base.sql` alone against an upgraded database because it represents the original direct-write policies. `lab_progress_migration.sql` is retained for historical reference; current setup includes the newer catalogue validation.

Regenerate SQL after content changes with `node scripts/generate-database.cjs`. Stable question IDs and existing student history are preserved. No production migration is performed by the static build.
