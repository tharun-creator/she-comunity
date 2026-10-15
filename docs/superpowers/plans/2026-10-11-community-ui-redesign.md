# SheStays Community UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the SheStays community shell and feed to feel cohesive, reference-inspired, and mobile-first while preserving the product design system and behavior.

**Architecture:** Keep Next.js routes and React Query behavior; improve the shared `AppShell`, its feed entry/composition, and existing reusable community components. Apply mobile-first Tailwind styles and the existing semantic tokens without new dependencies.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, existing SheStays components and design tokens.

**Spec:** `docs/superpowers/specs/2026-10-11-community-ui-redesign-design.md`

## Global Constraints

- Preserve SheStays colors and Inter typography in `docs/DESIGN-SYSTEM.md`.
- Keep routes, API/query behavior, and existing content actions unchanged.
- Mobile baseline targets 320–390px; add desktop layouts with min-width breakpoints.
- Keep interactive touch targets at least 44px high and reserve space for fixed mobile navigation.
- Do not add dependencies or change backend/auth behavior.

## Review Focus

- At 320px, long community names and post copy wrap without horizontal page overflow; verify at a 320px viewport.
- With bottom navigation fixed, the last feed action remains reachable; verify page bottom padding includes the nav and safe-area inset.
- With loading or empty data, the feed keeps its hierarchy; inspect the existing loading and empty states.
- At desktop widths around the column breakpoints, the center feed remains readable and sidebars do not overlap; inspect 768px, 1024px, and 1440px layouts.
- Keyboard users can identify the focused navigation and actions; inspect visible focus treatment and 44px interactive heights.

---

### Task 1: Recompose the shared community shell

**Files:**
- Modify: `apps/web/src/components/shestays/app-shell.tsx`
- Modify: `apps/web/src/components/shestays/top-nav.tsx`
- Modify: `apps/web/src/components/shestays/mobile-post-fab.tsx`

**Interfaces:**
- Consumes existing route links, `rightSidebar`, and `hideLeftSidebar` props.
- Produces the same `AppShell` interface with clearer desktop columns, mobile safe-area spacing, active states, and thumb-reachable navigation/actions.

- [x] Set the base shell to a single-column layout with mobile bottom spacing and 44px navigation targets.
- [x] Add min-width desktop layout rules for the left rail, reading column, and contextual right rail.
- [x] Retain current link destinations and active-route behavior while improving focus-visible and active treatments.
- [ ] Inspect 320px, 768px, 1024px, and 1440px widths for overlap and horizontal overflow.

### Task 2: Make Home read as a community activity feed

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/components/shestays/quick-post-card.tsx`
- Modify: `apps/web/src/components/shestays/filter-pill-bar.tsx`
- Modify: `apps/web/src/components/shestays/feed-post-card.tsx`
- Modify: `apps/web/src/components/shestays/post-card.tsx`

**Interfaces:**
- Keep `fetchHomeFeed`, area query parameter, post type filtering, and post actions unchanged.
- Keep current component props and use existing `PgPickerDialog` for compose.

- [x] Add a compact, responsive community heading and compose prompt that fit the current route and data model.
- [x] Establish visible hierarchy between filters, feed cards, and community metadata using current semantic colors.
- [x] Keep filter controls scrollable on narrow screens, keyboard-operable, and at least 44px high.
- [x] Preserve current loading and empty states and ensure each remains useful at phone widths.
- [x] Keep the mobile compose action clear of bottom tabs and safe-area insets.

### Task 3: Align shared discovery surfaces and design-system documentation

**Files:**
- Modify: `apps/web/src/components/shestays/trending-discussions-panel.tsx`
- Modify: `apps/web/src/components/shestays/suggested-pgs-panel.tsx`
- Modify: `apps/web/src/components/shestays/pg-card.tsx`
- Modify: `apps/web/src/components/shestays/sidebar-extras.tsx`
- Modify: `docs/DESIGN-SYSTEM.md`

**Interfaces:**
- Keep existing panel queries, card props, links, and join actions.
- Document the shipped responsive layout and hierarchy without changing brand tokens or route structure.

- [x] Give discovery panels and PG cards distinct but related surface hierarchy, with comfortable mobile reading and desktop scan density.
- [x] Preserve responsive behavior when the right rail is hidden on phones.
- [x] Update design-system layout guidance to match the implemented shell and reference-inspired feed composition.

### Task 4: Apply consistent responsive polish to the remaining community routes

**Files:**
- Modify: `apps/web/src/app/search/page.tsx`
- Modify: `apps/web/src/components/shestays/app-shell.tsx` (wide content option for Search)
- Modify: `apps/web/src/app/notifications/page.tsx`
- Modify: `apps/web/src/app/profile/page.tsx`
- Modify: existing PG and post detail page components only where shared shell/content spacing breaks the agreed responsive layout.

**Interfaces:**
- Preserve current queries, forms, dialogs, destinations, and mutation behavior.

- [x] Align screen headings, content spacing, card surfaces, and empty states with the shared visual direction.
- [x] Make Search useful before typing with area filters, discoverable PG rows, and a selected PG summary; keep the preview inline on mobile and adjacent on desktop.
- [x] Check dialogs and forms at phone widths, including keyboard focus and reachable controls.
- [ ] Inspect route layouts on narrow mobile and desktop widths.

### Task 5: Review the visual result and document the final system

**Files:**
- Modify: `docs/DESIGN-SYSTEM.md` if the shipped radius, layout, or component guidance differs from this plan.

- [ ] Review all community screens at mobile and desktop widths and remove decoration that does not improve scanability or navigation. Home was reviewed on mobile; Search was reviewed at 390px mobile and 1440px desktop.
- [ ] Run the web app typecheck and production build; address regressions in touched files.
- [ ] Summarize changed screens, responsive behavior, and any verification limitation.

**Verification record:** Targeted ESLint passed. `npm run typecheck` still reports type errors in the admin page, home feed data shape, compose flow, trending-discussion data shape, post mutation adapter, and API post adapter; it reports none in the Search route. The sandboxed production build and dev-server attempts stop during Next/SWC startup while canonicalizing the workspace path (`Access is denied`); the dev server was then started with workspace access and the Search page was visually reviewed at mobile and desktop widths. No tests were run.
