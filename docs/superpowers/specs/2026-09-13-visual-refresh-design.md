# Visual Refresh — Sharp/Modern Design Pivot

## 1. Why

The current DESIGN-SYSTEM.md (§2, §6) locks in "rounded corners throughout, buttons full-pill" as
the intentional brand feel, inherited directly from a booking-app reference UI. The product owner
now wants a more modern, premium feel — full-pill buttons read as generic/AI-templated rather than
premium. Competitive research (Fishbowl/Blind, Peanut, HerKey) confirms the niche skews either
utilitarian-flat (anonymity-first apps) or warm-rounded (women's community apps); neither matches
the "premium, modern" target, so this is a deliberate departure rather than a niche-catchup move.
2026 SaaS design trend data ("Clean Brutalism": sharp/near-sharp corners, 1px borders, restrained
color, typography-led hierarchy) supports sharp corners reading as *more* reliable/premium, not less.

This pivot supersedes DESIGN-SYSTEM.md §2 (reference-UI shape carryover) and §6 (rounded/pill tone
guidance). The brand palette and typography are **not** in question — only the shape language,
icon set, illustration system, loading components, and favicon.

## 2. Scope

In scope:
- Corner radius pivot: full-pill / 16-20px → 2-4px, applied to buttons, cards, chips, inputs, dialogs.
- Shadow/border rebalance: lighter shadows, 1px solid borders doing more visual work.
- Icon set swap: `lucide-react` → `@tabler/icons-react`, app-wide, one-for-one by icon name.
- New illustration system: 4-6 single-color flat/hand-drawn-hybrid doodles, empty states + onboarding only.
- New favicon: wordmark-derived mark, brand pink, standard multi-size set.
- New loading components: branded shimmer skeleton (pink-tinted gradient sweep) + branded spinner
  for button-level pending states.
- DESIGN-SYSTEM.md updated so it no longer contradicts the shipped UI.

Out of scope (separate future work, not blocked by this spec):
- Any change to color tokens, typography family/weights, or information architecture.
- The phone-OTP auth/onboarding flow itself (not built yet — the spec only reserves an illustration
  slot for it).
- Booking/owner-side features, Supabase wiring — unrelated to this visual pass.
- Mobile performance audit (§7) is scoped as a verification pass over work already done, not new
  feature work.

## 3. Component-by-component impact

### 3.1 Radius tokens
Add/replace radius tokens in the design system (Tailwind theme, likely `apps/web/src/app/globals.css`
or `tailwind.config` equivalent — confirm exact token location during implementation):
- `--radius-sm: 2px` (chips, inputs, small buttons)
- `--radius-md: 4px` (cards, dialogs, larger buttons)
- Remove/stop using `rounded-full` and `rounded-2xl`/`rounded-3xl` utility classes on interactive
  and container elements; replace with the new tokens.

Every component currently using `rounded-full` for buttons/pills or `rounded-2xl` for cards needs a
pass. From the current codebase, that's at minimum: `Button` (ui/button.tsx), `FilterPillBar`,
`PostCard`, `FeedPostCard`, `PgListRow` (if reintroduced), `QuickPostCard`, `SidebarExtras`,
`TrendingDiscussionsPanel`, `Dialog`/`DialogContent`, `Input`, `RatingTagChip`, `Avatar` (avatars
stay circular — this is a deliberate exception, not an oversight, since circular avatars are a
near-universal convention independent of the brutalism/pill debate), `MobilePostFab`,
`AnonymousToggle`/`anonymous-tag`, `ReportModal`.

Tap targets: shrinking radius must not shrink hit area — every interactive element keeps its
current padding/min-height (44px touch target minimum stays enforced), only the corner curvature
changes.

### 3.2 Icon set swap
Replace `lucide-react` imports with `@tabler/icons-react` equivalents throughout. Tabler's default
export naming differs from lucide (`IconHome`, `IconSearch`, etc. vs `Home`, `Search`), so this is a
mechanical but wide-reaching rename across every file that imports an icon — not a visual redesign
of the icons themselves (Tabler already matches the sharp/technical direction with its consistent
2px stroke). Build a mapping table of every lucide icon currently used → the Tabler equivalent
before touching component files, so nothing gets silently dropped.

### 3.3 Illustration system
4-6 pieces needed, single-color line style (brand pink or ink-navy), sourced/adapted from an open
recolorable set (Charco/unDraw-style) rather than commissioned original art:
1. Empty home feed ("no activity in this area yet")
2. Empty notifications
3. Empty search results
4. Empty saved posts
5. (Reserved, not built yet) Phone-OTP onboarding — slot only, no implementation until the auth flow exists.

Each illustration is a static SVG asset, recolored via a single CSS variable or `fill`/`stroke`
prop so it can flip between the two approved tones without a re-export.

### 3.4 Favicon
Single mark (not the "SheStays" wordmark) derived from the existing brand identity, brand pink,
exported as the standard set (`favicon.ico`, 32/192/512 PNG, `apple-touch-icon`) and wired into
`apps/web/src/app/layout.tsx` metadata.

### 3.5 Loading components
- Skeleton: replace the current flat `bg-muted` pulse (`ui/skeleton.tsx`) with a shimmer — a
  pink-tinted gradient band animating across the same shape, same usage call sites (no API change
  to the `Skeleton` component's props, purely a style swap so every current call site benefits with
  zero code changes elsewhere).
- Spinner: new small branded spinner component for inline pending states (vote, save, post-submit
  buttons) — currently these show no distinct loading affordance beyond disabled state; add one.

### 3.6 DESIGN-SYSTEM.md updates
Rewrite §2 (reference UI carryover line about "pill-shaped primary button carried through directly")
and §6 (tone/feel radius guidance) to describe the new 2-4px radius direction, so the doc stops
contradicting the shipped product. Keep §1 (tokens), §3 (typography), and §4/§5 (component
inventory/layout) as-is except where a component's shape description needs the radius number updated.

## 4. Data flow / error handling

Purely presentational change — no data flow, API, or mock-data-layer impact. No new error states
beyond what illustrations need to render (a missing/failed SVG import should fail the build, not
silently degrade at runtime, since these are bundled static assets not remote-fetched).

## 5. Testing

- Visual check per screen (Home, Search, PG place page, Post detail, Compose, Profile,
  Notifications) at both desktop and mobile viewport, before/after screenshots.
- Confirm no icon import is left unresolved (build must fail loudly, not render a blank icon, if a
  lucide→Tabler mapping was missed).
- Confirm tap targets unchanged (spot-check button computed height/width before and after).
- Confirm illustrations render in both light contexts the app currently supports (the app doesn't
  yet have a dark mode, so this is single-theme for now).
- Lighthouse mobile pass on Home and a PG place page after the swap, to catch any bundle-size
  regression from the icon library swap or new SVG assets.

## 6. Sequencing (for the implementation plan)

1. Radius token + component sweep (largest, most mechanical, highest visual impact first).
2. Icon set swap (mechanical, can happen in parallel with #1 but should land as its own commit for
   easy revert if any icon mapping is wrong).
3. Loading components (skeleton shimmer + spinner) — small, self-contained.
4. Illustration system + empty-state wiring.
5. Favicon.
6. DESIGN-SYSTEM.md rewrite (documents the end state — do this last so it reflects what actually shipped).
7. Mobile performance verification pass.

## 7. Mobile performance verification

Not new feature work — a checklist run after §6.1-6.6 land:
- Lighthouse mobile score on `/` and a `/pg/[id]` page, before/after comparison.
- Verify new Tabler icon imports are tree-shaken (named imports only, no `import *`).
- Verify new SVG illustrations are optimized (SVGO or equivalent) before committing.
- Re-confirm 44px minimum tap targets after the radius change on the mobile bottom nav and FAB.
