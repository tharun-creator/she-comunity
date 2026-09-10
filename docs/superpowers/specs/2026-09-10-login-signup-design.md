# Login / signup pages — design spec

Date: 2026-09-10
Status: approved for implementation

## Context

SheStays Community (`apps/web`) has no authentication flow at all — every
screen runs against a single mock `currentUser` (`apps/web/src/lib/mock-data.ts`).
`@supabase/supabase-js` and `@supabase/ssr` are already dependencies, and
browser/server Supabase clients already exist
(`apps/web/src/lib/supabase/client.ts`, `.../server.ts`), created in an
earlier pass but never used by any page. `apps/web/.env.local` and
`apps/web/.env.example` already have `NEXT_PUBLIC_SUPABASE_ANON_KEY` slotted
in (currently a placeholder pending the real key from the Supabase
dashboard).

The PRD (docs/PRD.md §5.4) describes the trust model: v1 is "self-attestation
+ phone OTP, not identity verification." Phone OTP needs an SMS provider
configured in the Supabase dashboard, which is out of this pass's reach —
this spec uses Supabase's email/password auth instead, but keeps the
self-attestation checkbox, since that's the trust mechanism the product
actually relies on, independent of the delivery channel for verification.

## Goals

- Real `/login` and `/signup` pages backed by Supabase Auth (accounts
  genuinely created and authenticated, not mocked).
- A split-screen layout — a supplied hero image on one side, the form on the
  other — reusable across both pages.
- No SQL injection surface: this flow never constructs a SQL string. Supabase
  Auth (GoTrue) is a managed REST service; our code only ever calls
  `supabase.auth.signUp()` / `signInWithPassword()`, which the Supabase JS
  SDK sends as JSON over HTTPS. There is no raw query anywhere in this flow
  for injection to target.
- Non-enumerable login failures: a wrong password and a nonexistent email
  produce the same generic error message.
- Self-attestation checkbox on signup, required to submit — PRD §5.4's core
  trust gate, independent of phone-OTP vs. email verification.

## Non-goals (this pass)

- Phone OTP verification (needs SMS provider setup in the Supabase
  dashboard — out of reach here).
- Wiring the rest of the app to the real session. Per the approved
  decision, this is a **self-contained gate**: successful login/signup
  redirects into the existing app, which keeps running on the mock
  `currentUser` exactly as it does today. Replacing the mock everywhere
  with the real Supabase session is a separate, larger follow-up (tracked
  already as open work in README.md).
- Forcing login before using the app. The rest of the app stays reachable
  without signing in, same as now — a "Log in" link is added to navigation,
  not a route guard.
- Password reset / "forgot password" flow.
- Real functional testing against Supabase, since `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  is still a placeholder — implementation proceeds on the same trust as the
  rest of the Supabase wiring already in the repo (code correctness verified
  by reading and by `tsc`/build, not by a live signup).

## Architecture & routing

```
apps/web/src/app/(auth)/
  layout.tsx        — AuthLayout: split-screen shell (image + slot)
  login/page.tsx      — login form
  signup/page.tsx       — signup form
```

A route group (parenthesized directory, no URL segment) so `/login` and
`/signup` are the actual paths, sharing one layout without appearing under
`AppShell` — these are full-bleed screens with no bottom nav / sidebar,
distinct from the rest of the app the way `AdminShell` is (admin panel
spec, same day) but visually on-brand (light theme, not dark — this is a
new-user-facing screen, not a backstage tool).

`AuthLayout` renders a two-column grid on `lg:` and up (image column,
content column via `children`); below `lg:`, the image column is hidden
entirely (not stacked — see UI design) and only the form shows.

Both pages are client components using the existing browser Supabase client
(`createClient()` from `@/lib/supabase/client`) — Supabase Auth calls run
directly from the browser to Supabase's GoTrue service, never through our
own backend, which is the standard and recommended pattern for this kind of
auth and is what keeps the SQL-injection surface at zero (see Goals).

**Login** (`/login`):
- Fields: email, password.
- Submit → `supabase.auth.signInWithPassword({ email, password })`.
- On success: `router.push("/")`.
- On error: a single generic message — "Invalid email or password." —
  regardless of whether Supabase's error indicates a wrong password or no
  such account, so the form can't be used to enumerate registered emails.
- Link to `/signup`: "New here? Create an account."

**Signup** (`/signup`):
- Fields: email, password, display name, city — matches the `users` table
  columns in `docs/schema.sql` (`display_name`, `city` are required
  columns there).
- A required checkbox: "I identify as a woman." Submit button stays
  disabled until checked — this is PRD §5.4's self-attestation gate, kept
  regardless of the verification channel.
- Submit → `supabase.auth.signUp({ email, password, options: { data: { display_name, city } } })`.
  The `display_name`/`city` land in the new user's `auth.users.user_metadata`
  — wiring a signup trigger that copies them into the `public.users` table
  (per `docs/schema.sql`'s `auth_user_id` FK) is backend work out of scope
  here (no live anon key to test against yet either — see Non-goals).
- On success: Supabase's project-level email-confirmation setting is
  assumed on (the default) — show a "Check your email to confirm your
  account" success state in place of the form, not an immediate redirect.
  If a project has confirmation off, `signUp()` still returns a session
  immediately; handle both by checking whether the response includes a
  session and only then redirecting, otherwise show the check-email state.
- On error: surface Supabase's message directly (e.g. "Password should be
  at least 6 characters", "User already registered") — these are safe to
  show verbatim, unlike login, since a failed signup attempt on an
  already-registered email is expected, discoverable behavior on any
  signup form, not a new enumeration vector.
- Link to `/login`: "Already have an account? Log in."

**Entry point:** a "Log in" link added to `TopNav` (desktop,
`apps/web/src/components/shestays/top-nav.tsx`) and the mobile bottom nav
is unchanged (mobile nav is a fixed 4-item tab bar for the core app
sections; adding a 5th item there would crowd it — the desktop top nav
entry point plus each page's own cross-link is enough for this pass).

## Image handling

The hero image is supplied by the project owner, who has confirmed rights
to use it. It is placed at `apps/web/public/auth-hero.jpg` (or `.png` —
whichever matches the actual file) and referenced with a plain `<img>`
(consistent with the rest of the codebase's existing "no next/image"
convention — see `post-card.tsx`'s `imageUrl` rendering from the earlier
poll/image-post work) inside `AuthLayout`'s image column, `object-cover`,
full-bleed within that column.

## UI / visual design

- `AuthLayout`: `grid lg:grid-cols-2 min-h-screen`. Image column
  (`hidden lg:block`, so mobile shows the form full-width without an
  awkward stacked photo eating scroll space) with the image as a full-bleed
  background (`object-cover`, `h-full w-full`) and the SheStays wordmark
  overlaid top-left. Content column centers the form vertically with
  standard page padding, `max-w-sm` form width, matching the rest of the
  app's card/input styling (`Input`, `Label`, `Button` from
  `components/ui`, `border-border`/`bg-card` tokens) — this is the light
  theme, not `AdminShell`'s dark scope.
- Both forms use existing primitives: `Input`, `Label`, `Button` (already
  used identically in `compose/page.tsx`), a plain HTML checkbox styled
  the same way `report-modal.tsx` already styles its radio inputs
  (`accent-[var(--ss-primary)]`).
- Loading state: submit button shows "Signing in…" / "Creating account…"
  and is disabled while the Supabase call is in flight, matching the
  existing `mutation.isPending` pattern used throughout the app (e.g.
  `compose/page.tsx`'s `mutation.isPending ? "Posting…" : "Post"`).

## Testing / verification

No test framework exists in `apps/web` (same as the admin panel spec) —
verified manually via the dev server, plus `tsc --noEmit`/`next build`
for type/compile correctness. Because `NEXT_PUBLIC_SUPABASE_ANON_KEY` is
still a placeholder, a live signup/login round-trip cannot be exercised
end-to-end in this pass:
- Both pages render correctly (image column on desktop, hidden on mobile;
  form fields present; checkbox required on signup).
- Client-side validation: signup submit stays disabled until the
  attestation checkbox is checked and both email/password have values;
  login submit disabled until both fields have values.
- Supabase call wiring is verified by reading the code against the SDK's
  documented `signUp`/`signInWithPassword` signatures (already used
  correctly elsewhere is not applicable — this is the first usage — so
  this task's reviewer checks the call shapes directly against
  `@supabase/supabase-js`'s types in `node_modules`).
- A live functional test (real signup → real Supabase row → real login) is
  explicit follow-up work once the anon key is in place — tracked in
  README.md's existing "What's needed to go further" list, not duplicated
  here.

## Open questions / future work

- Wiring a Supabase Auth trigger (or a Postgres function) that creates the
  matching `public.users` row on signup, copying `display_name`/`city` from
  `user_metadata` and setting `women_attested_at` from the checkbox — this
  is server-side/database work, separate from this frontend-only pass.
- Full session integration (replacing the mock `currentUser` app-wide) —
  see Non-goals.
- Password reset flow.
- Real phone OTP once an SMS provider is configured.
