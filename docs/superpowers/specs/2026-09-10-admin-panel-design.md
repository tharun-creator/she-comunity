# Admin panel — design spec

Date: 2026-09-10
Status: approved for implementation

## Context

SheStays Community (`apps/web`) has no admin/moderation surface today. The
PRD (docs/PRD.md §5.5, §8) calls for a "manual review queue for reported
content" as part of Phase 1 scope, and `docs/schema.sql` already has a
`reports` table with `pending`/`actioned`/`dismissed` status, plus
`resolved_by`/`resolved_at`, locked to `service_role` only by
`docs/rls-policies.sql`. The mock data layer's `reportContent()` currently
returns `{ok: true, ...input}` without persisting anything, so reports
disappear the moment they're filed — there's nowhere to review them.

This spec covers building that missing admin surface: a reports queue, PG
management (including PGs below the public-visibility threshold), and basic
user moderation (suspend/reinstate).

## Goals

- A `/admin` section with three views: Reports, PGs, Users.
- Reports: see reported posts/comments with reason + detail, mark
  actioned/dismissed.
- PGs: see every PG (including sub-threshold ones regular users can't see),
  toggle public visibility.
- Users: see a roster with post/report counts, suspend or reinstate.
- Visually distinct "backstage" surface, but still recognizably SheStays
  (pink accent, not a foreign dark-fintech skin).

## Non-goals (this pass)

- Real authentication/authorization. The whole app runs on a single mock
  `currentUser` with no login flow. The admin allowlist check documents the
  *intended* mechanism for when real auth exists; it is not a security
  boundary today.
- Wiring to the live Supabase DB. Stays on the mock-data layer, consistent
  with every other screen in the app, per the async-signature convention
  already established in `mock-data.ts`.
- Editing PG core fields (name/area/address), deleting content, banning at
  the account-deletion level, audit-log UI. Suspend/reinstate + visibility
  toggle only.
- A generic reusable "master-detail" component. Three pages, similar shape,
  built separately — see Components below for why.

## Architecture & routing

```
apps/web/src/app/admin/
  layout.tsx          — AdminGuard + AdminShell
  page.tsx             — redirects to /admin/reports
  reports/page.tsx      — reports master-detail view
  pgs/page.tsx           — PGs master-detail view
  users/page.tsx          — users master-detail view
```

Each section is its own route (not one tabbed mega-page), matching the
existing file-routing convention used by `/pg/[id]/compose` etc. — URLs are
shareable/bookmarkable, and each page is a focused, independently-readable
unit.

`layout.tsx` wraps all three pages in:
1. `AdminGuard` (`src/components/admin/admin-guard.tsx`) — client component
   that reads `currentUser` from the mock profile query, checks its `id`
   against `ADMIN_USER_IDS` (`src/lib/admin.ts`), and renders an
   "Admins only" message with a link home if not allowed. No route-level
   redirect/middleware — this is a UI gate, not a security boundary (see
   Non-goals).
2. `AdminShell` (`src/components/admin/admin-shell.tsx`) — the dark top bar
   + pill nav + stat-card slot described under UI design below.

Entry point: a quiet "Admin" link on the Profile page
(`src/app/profile/page.tsx`), rendered only when `isAdmin(currentUser.id)`
is true.

## Data layer (`apps/web/src/lib/mock-data.ts`)

All additions follow the file's existing pattern: an in-memory array plus
`async` accessor/mutator functions with the same signatures a real API
client would have.

**Reports**
```ts
// New backing store — reportContent() currently discards its input.
const reports: Report[] = [];

// Replaces the current no-op body: pushes a real Report, still returns {ok, ...input}.
export async function reportContent(input: {
  targetType: "post" | "comment";
  targetId: string;
  reason: ReportReason;
  detail?: string;
}): Promise<{ ok: true }>;

export async function fetchReports(): Promise<Report[]>; // newest first

export async function resolveReport(
  id: string,
  status: "actioned" | "dismissed"
): Promise<Report>;
```

**PGs**
```ts
// Unlike fetchDiscoverFeed, does not filter by isPubliclyVisible —
// admin needs to see PGs below the §11 threshold too.
export async function fetchAllPgsAdmin(): Promise<Pg[]>;

export async function setPgVisibility(pgId: string, visible: boolean): Promise<Pg>;
```
`setPgVisibility` writes directly to the existing `Pg.isPubliclyVisible`
field (already a stored, not computed, field in the mock) — no schema
change needed.

**Users**
```ts
// New: UserProfile gains an optional isSuspended flag (undefined = active,
// matching the existing optional-field style e.g. Pg.address).
// New small roster synthesized from existing named post authors
// (Divya R., Sneha R., Meena K., Anjali T.) plus currentUser (Priya S.),
// each carrying a derived postCount and reportsAgainstCount.
export interface AdminUserSummary extends UserProfile {
  postCount: number;
  reportsAgainstCount: number;
  isSuspended: boolean;
}

export async function fetchAllUsersAdmin(): Promise<AdminUserSummary[]>;

export async function setUserSuspended(userId: string, suspended: boolean): Promise<AdminUserSummary>;
```

`types/domain.ts` changes: add `isSuspended?: boolean` to `UserProfile`.

## Components

Three page components, each following the same master-detail shape but
written independently rather than through a shared generic component —
the three data shapes (report / PG / user) differ enough in their detail
panel content and actions that a forced abstraction would need several
escape hatches immediately. Small structural duplication across three
~150-line page files is cheaper to read than a leaky abstraction.

Each page:
- Left column: filterable row list (status pills at the top — e.g. All /
  Pending / Actioned / Dismissed for reports), each row shows the key
  summary fields, selected row highlighted.
- Right column: detail panel for the row named by the `?selected=<id>`
  query param (same pattern as the home feed's `?area=` filter) — shows
  full detail and the relevant action buttons.
- Empty state (no selection) shows a placeholder prompt.

Shared low-level UI primitives only (`Button`, existing `Badge`-equivalent
pill styles, `Card`-style bordered containers) — no new generic components
beyond `AdminShell` and `AdminGuard`.

## UI / visual design

`AdminShell` renders a dark surface (`bg-[#0B1220]`-family tokens, scoped
only inside `/admin` via a wrapper class — the rest of the app is
untouched) with:
- A top bar: SheStays wordmark + a pill segmented nav (Reports / PGs /
  Users), echoing the existing `top-nav.tsx` pill style but on dark.
- A stat-card row below it: pending reports count, PGs below the
  visibility threshold, suspended users — styled after the screenshot's
  stat-card row (dark card, big number, small label).
- Accent color throughout is SheStays pink (`--ss-primary` / `#F82A78`),
  replacing the reference screenshot's neon green — keeps this
  recognizably the same product rather than a bolted-on foreign tool.

## Testing / verification

No test framework exists in `apps/web` yet (no test runner configured) —
consistent with the rest of the codebase, this is verified manually via
the dev server:
- Visit `/admin` as the allowlisted mock user → lands on `/admin/reports`.
- File a report from the existing report modal on a post → appears in the
  reports queue; resolve it → status updates, list re-filters.
- Toggle a sub-threshold PG's visibility → confirm it would now appear in
  the public discover feed (cross-check against `fetchDiscoverFeed`).
- Suspend a user → flag reflected in the users list; reinstate → reverts.
- Temporarily remove the mock user's id from `ADMIN_USER_IDS` → confirm
  the guard's "Admins only" state renders instead of the panel.

## Open questions / future work

- Real auth + a real `is_admin` role (Supabase) replacing the hardcoded
  allowlist — tracked as a prerequisite in the README already (auth flow
  is still undesigned).
- Wiring these mock functions to live Supabase queries once auth exists,
  using `service_role` server-side (a Route Handler or the FastAPI
  backend) — the browser can never hold `service_role` directly.
- Audit log of admin actions (who resolved what, when) — schema doesn't
  track this beyond `resolved_by`/`resolved_at` on `reports`; PGs/users
  have no equivalent yet.
