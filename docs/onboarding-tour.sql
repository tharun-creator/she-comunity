-- SheStays Community — first-time onboarding tour
-- Run once after docs/schema.sql, docs/rls-policies.sql, docs/hardening.sql,
-- and docs/signup-trigger.sql.
--
-- Tracks whether a user has completed the post-login onboarding tour (see
-- apps/web/src/components/shestays/onboarding-tour.tsx). Nullable timestamp
-- rather than a boolean so "when" is available for free if it's ever useful
-- (re-running the tour after a redesign, analytics, etc.).
--
-- No RLS/grant change needed: docs/rls-policies.sql's `users_update_self`
-- policy and docs/hardening.sql's `grant select, update on users to
-- authenticated` already cover updating this column on your own row.

alter table users add column if not exists onboarded_at timestamptz;
