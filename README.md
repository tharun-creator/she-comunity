# SheStays Community

Repo structure and product decisions: see [docs/PRD.md](docs/PRD.md), [docs/TECH-STACK.md](docs/TECH-STACK.md),
[docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

## Current state (Phase 1 of the delivery order)

`apps/web` is a working Next.js app with the full design system wired in, running
against an **in-memory mock data layer** (`apps/web/src/lib/mock-data.ts`) — no
Supabase project is connected yet. Every screen in the PRD's information architecture
is built and clickable:

- Discover feed with area filters
- Search + "can't find it, add this PG"
- PG place page (feed, sort, stats sidebar)
- Post detail + nested comment thread
- Compose (review / discussion / poll) with the anonymous toggle
- Profile, Notifications

The mock functions in `mock-data.ts` have the exact async signatures the real API
client will have, so swapping them for real Supabase/FastAPI calls is a drop-in
replacement, not a rewrite.

`apps/api` is a FastAPI skeleton (`docs/schema.sql` has the matching Postgres schema)
— not yet wired to a database.

## Database status

A Supabase project is connected (`db.ectvnyrdohctcpwblqgl.supabase.co`). `docs/schema.sql`,
`docs/rls-policies.sql`, and `docs/hardening.sql` are all applied — every table has RLS
enabled *and forced*, and grants to `anon`/`authenticated` are pared down to exactly what
each table's policies use (no TRUNCATE, no blanket `ALL`; see `docs/hardening.sql` for why
that mattered on top of the base RLS policies). `apps/web` has the Supabase client
scaffolding in place (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`,
`src/proxy.ts` for session refresh — this Next.js version renamed `middleware.ts` to
`proxy.ts`), but **the frontend still reads from the in-memory mock** (`mock-data.ts`) —
none of its ~20 functions have been swapped to live Supabase queries yet.

That swap is intentionally not done yet because RLS requires a real signed-in user for
almost every read/write, and there's no auth flow in the frontend at all yet (PRD §5.4
calls for phone OTP + self-attestation, which hasn't been built). Wiring live queries in
before auth exists would break the demo without adding real functionality — worth its own
pass once the auth approach is decided.

## What's needed to go further

1. **Anon key** — in the Supabase dashboard → Project Settings → API, copy the
   `anon` `public` key and drop it into `apps/web/.env.local` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   currently a placeholder). This key is safe to expose client-side by design.
2. **Service role key** — same page, the `service_role` key, into `apps/api/.env`
   (`SUPABASE_SERVICE_ROLE_KEY`, also a placeholder). This one bypasses RLS entirely —
   it must never reach `apps/web` or get committed.
3. **Rotate the DB password** — it's been shared in chat/session history at this point;
   rotate it from the dashboard (Project Settings → Database) once convenient, and update
   `DATABASE_URL` in `apps/api/.env` to match.
4. Decide the auth approach (phone OTP vs. something simpler for now), build the sign-in
   flow, then swap `mock-data.ts`'s functions for real Supabase queries one at a time.

## Running the frontend now

```bash
cd apps/web
npm run dev
```

Open http://localhost:3000 — no environment variables needed for the current mock-data build.

## Open items before public launch (see PRD.md §11)

- Legal review of anonymous-review liability (defamation / intermediary liability).
- The §11 visibility threshold (3 accounts or 5 reviews) is a build-time default —
  revisit once there's real usage data.

## A note on disk space

This machine's C: drive is at ~100% usage (52 MB free at last check). That's already
caused one build-cache write failure (non-fatal, the build still completed). npm
installs, git operations, and future builds will get less reliable as it stays this
full — worth freeing up space before doing much more here.
