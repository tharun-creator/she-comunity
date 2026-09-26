# Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot the SheStays web app's shape language from soft/full-pill to sharp (2-4px radius), swap the icon set to Tabler, add a small doodle illustration system for empty states, ship a real favicon, and replace the flat loading skeleton with a branded shimmer + spinner — without touching color tokens, typography, or app behavior.

**Architecture:** Almost the entire radius pivot is achieved by changing a single CSS custom property (`--radius` in `globals.css`), because this codebase already derives every `rounded-{sm,md,lg,xl,2xl,3xl,4xl}` Tailwind utility from that one variable via `@theme inline`. The remaining work is: (a) a short, explicit list of hard-coded `rounded-full` class overrides that bypass the token system and need individual edits, (b) a mechanical icon-import rename from `lucide-react` to `@tabler/icons-react`, (c) new small components (EmptyState + 4 SVG doodles, Spinner, shimmer Skeleton), and (d) Next.js's App Router dynamic icon convention (`icon.tsx`/`apple-icon.tsx`) for the favicon, which avoids needing to hand-produce binary image files.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4 (CSS-first `@theme` config), `@base-ui/react` component primitives, `@tanstack/react-query`, `lucide-react` → `@tabler/icons-react`.

**Spec:** [docs/superpowers/specs/2026-09-13-visual-refresh-design.md](../specs/2026-09-13-visual-refresh-design.md)

## Global Constraints

- Do not change any `--ss-*` color token, font family, or font weight in `globals.css` — only radius tokens and the new shimmer keyframe are in scope.
- Every interactive element's padding/min-height stays exactly as it is today — only `rounded-*` class names change; no `h-*`, `w-*`, `size-*`, or `p-*` value changes in this plan.
- Circular UI conventions stay circular — do not touch `rounded-full` on: `Avatar` (`components/ui/avatar.tsx`), the `Switch` track/thumb (`components/ui/switch.tsx`), `VoteControl`'s up/down buttons (`components/shestays/vote-control.tsx`), the top-nav icon buttons and unread dot (`components/shestays/top-nav.tsx` lines 74/81/85), the numbered circle in `TrendingDiscussionsPanel` (line 32), the circular community-icon badge in `FeedPostCard` (line 16), the circular PG-place-page FAB (`app/pg/[id]/page.tsx` line 133), and the small circular remove-image button in compose (`app/pg/[id]/compose/page.tsx` line 159). These are functionally circles (equal width/height icon affordances), not pill-button chrome, and are explicitly out of scope for the "no pill buttons" pivot.
- `apps/web/src/components/shestays/inline-composer.tsx` and `apps/web/src/components/shestays/community-scroller.tsx` are dead code (imported nowhere as of this plan) — do not edit them as part of the radius or icon sweep; leave them untouched.
- This repo has no test runner configured (no Jest/Vitest in `package.json`). "Verify" steps use `npm run build`, `npm run lint`, and the running dev server + browser preview instead of automated unit tests — do not add a test framework as part of this plan, that's out of scope.
- Every commit in this plan must leave `npm run build` passing — the icon swap in particular must fail the TypeScript build loudly (unresolved import) rather than silently render a missing icon, per the spec's testing section (§5).

---

### Task 1: Radius token pivot

**Files:**
- Modify: `apps/web/src/app/globals.css:104`

**Interfaces:**
- Produces: every Tailwind `rounded-{sm,md,lg,xl,2xl,3xl,4xl}` utility across the whole app now resolves to a value derived from the new 3px base instead of the old 16px base. No component code changes in this task — later tasks build on this new visual baseline.

- [ ] **Step 1: Change the base radius token**

In `apps/web/src/app/globals.css`, line 104 currently reads:

```css
  --radius: 1rem;
```

Change it to:

```css
  --radius: 0.1875rem;
```

This makes the derived scale (from the `@theme inline` block above it, lines 53-59, unchanged): `--radius-sm` ≈ 1.8px, `--radius-md` ≈ 2.4px, `--radius-lg` = 3px, `--radius-xl` ≈ 4.2px, `--radius-2xl` ≈ 5.4px, `--radius-3xl` ≈ 6.6px, `--radius-4xl` ≈ 7.8px — landing every card/button/dialog/input in the approved 2-4px range (with slightly larger corners on the biggest containers, which is expected and fine).

- [ ] **Step 2: Verify the build still compiles**

Run: `cd apps/web && npm run build`
Expected: build succeeds with no errors (this is a pure CSS value change, nothing should break).

- [ ] **Step 3: Visually verify in the browser**

Start the dev server (`npm run dev` in `apps/web`), open `http://localhost:3000`, and confirm: post cards, the search bar, dialogs (open "Create post"), and buttons all show visibly sharper corners than before. The full-pill elements (filter tabs, search bar) will *not* look sharp yet — that's Task 2.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "Sharpen base radius token from 1rem to 0.1875rem"
```

---

### Task 2: Replace hard-coded pill overrides with the token-driven radius

These are the elements that bypass the token system with a literal `rounded-full` class on a non-circular (pill-shaped: wider than tall, with text/padding) element. Per Global Constraints, circular elements are explicitly excluded and untouched.

**Files:**
- Modify: `apps/web/src/components/shestays/filter-pill-bar.tsx:22`
- Modify: `apps/web/src/components/shestays/mobile-post-fab.tsx:18`
- Modify: `apps/web/src/app/page.tsx:52`
- Modify: `apps/web/src/components/shestays/pg-card.tsx:24`
- Modify: `apps/web/src/components/shestays/pg-card.tsx:49`
- Modify: `apps/web/src/components/shestays/post-card.tsx:110`
- Modify: `apps/web/src/components/shestays/post-card.tsx:124`
- Modify: `apps/web/src/components/shestays/post-card.tsx:189`
- Modify: `apps/web/src/app/pg/[id]/page.tsx:84`
- Modify: `apps/web/src/components/shestays/rating-tag-chip.tsx:17`
- Modify: `apps/web/src/app/pg/[id]/compose/page.tsx:123`

**Interfaces:**
- Consumes: the `--radius-lg` token from Task 1 (already resolves to 3px).
- Produces: no new exports — this task only changes className strings in existing components already used by Tasks elsewhere in the app.

- [ ] **Step 1: `filter-pill-bar.tsx`**

Line 22 currently:
```tsx
            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer",
```
Change to:
```tsx
            "shrink-0 rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer",
```

- [ ] **Step 2: `mobile-post-fab.tsx`**

Line 18 currently:
```tsx
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-heading px-4 py-3 text-sm font-medium text-white shadow-lg lg:hidden"
```
Change to:
```tsx
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-lg bg-heading px-4 py-3 text-sm font-medium text-white shadow-lg lg:hidden"
```

- [ ] **Step 3: `app/page.tsx` (home search bar button)**

Line 52 currently:
```tsx
        className="mb-3 flex w-full items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
```
Change to:
```tsx
        className="mb-3 flex w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
```

- [ ] **Step 4: `pg-card.tsx` (two badges)**

Line 24 currently:
```tsx
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary-hover">
```
Change to:
```tsx
          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary-hover">
```

Line 49 currently:
```tsx
          <span className="ml-auto rounded-full bg-warning/15 px-2 py-0.5 font-medium text-warning">
```
Change to:
```tsx
          <span className="ml-auto rounded-lg bg-warning/15 px-2 py-0.5 font-medium text-warning">
```

- [ ] **Step 5: `post-card.tsx` (role label, type badge, topic chip)**

Line 110 currently:
```tsx
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
```
(this is the `roleLabel` badge — "Resident"/"Anonymous"). Change to:
```tsx
                "rounded-lg px-2 py-0.5 text-[11px] font-medium",
```

Line 124 currently (the Review/Poll type badge, same pattern):
```tsx
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
```
Change to:
```tsx
                "rounded-lg px-2 py-0.5 text-[11px] font-medium",
```

Line 189 currently (topic hashtag chip):
```tsx
              className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
```
Change to:
```tsx
              className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
```

- [ ] **Step 6: `app/pg/[id]/page.tsx` (rating badge)**

Line 84 currently:
```tsx
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-base font-semibold text-primary-hover">
```
Change to:
```tsx
            <div className="flex shrink-0 items-center gap-1 rounded-lg bg-primary-soft px-3 py-1.5 text-base font-semibold text-primary-hover">
```

- [ ] **Step 7: `rating-tag-chip.tsx`**

Line 17 currently:
```tsx
        "inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground",
```
Change to:
```tsx
        "inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground",
```

- [ ] **Step 8: `app/pg/[id]/compose/page.tsx` (rating tag selector button)**

Line 123 currently:
```tsx
                    "rounded-full border px-3 py-1.5 text-sm font-medium",
```
Change to:
```tsx
                    "rounded-lg border px-3 py-1.5 text-sm font-medium",
```

- [ ] **Step 9: Verify build and visually check**

Run: `cd apps/web && npm run build` — expect success.
In the dev server, check: Home page filter tabs (All/Reviews/Discussions/Polls) and the search bar are now sharp-cornered pills-turned-rectangles; a post's "Review"/"Resident" badges and hashtag chips are sharp; the mobile FAB (resize browser to mobile width) is a sharp rectangle, not a capsule.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/components/shestays/filter-pill-bar.tsx apps/web/src/components/shestays/mobile-post-fab.tsx apps/web/src/app/page.tsx apps/web/src/components/shestays/pg-card.tsx apps/web/src/components/shestays/post-card.tsx "apps/web/src/app/pg/[id]/page.tsx" apps/web/src/components/shestays/rating-tag-chip.tsx "apps/web/src/app/pg/[id]/compose/page.tsx"
git commit -m "Replace hard-coded pill overrides with sharp radius token"
```

---

### Task 3: Icon set swap — lucide-react → @tabler/icons-react

**Files:**
- Modify: `apps/web/package.json`
- Modify (import + JSX rename): every file listed in the mapping table below (29 files)

**Interfaces:**
- Produces: no component in the app imports from `lucide-react` after this task; `package.json` no longer lists it as a dependency.

Name mapping (lucide import name → Tabler import name — install first, then use each file's own list of names below to edit only what that file imports):

| lucide-react | @tabler/icons-react |
|---|---|
| `Home` | `IconHome` |
| `Search` / `SearchIcon` | `IconSearch` |
| `Bell` | `IconBell` |
| `User` | `IconUser` |
| `MessageSquare` | `IconMessage` |
| `ArrowUpCircle` | `IconCircleArrowUp` |
| `AtSign` | `IconAt` |
| `ShieldCheck` | `IconShieldCheck` |
| `Plus` | `IconPlus` |
| `ChevronRightIcon` | `IconChevronRight` |
| `CheckIcon` / `Check` | `IconCheck` |
| `ChevronDownIcon` / `ChevronDown` | `IconChevronDown` |
| `ChevronUpIcon` / `ChevronUp` | `IconChevronUp` |
| `Users2` | `IconUsersGroup` |
| `Users` | `IconUsers` |
| `MapPin` | `IconMapPin` |
| `Star` | `IconStar` |
| `Bookmark` | `IconBookmark` |
| `Clock` | `IconClock` |
| `CircleCheckIcon` | `IconCircleCheck` |
| `InfoIcon` | `IconInfoCircle` |
| `TriangleAlertIcon` | `IconAlertTriangle` |
| `OctagonXIcon` | `IconCircleX` (Tabler has no octagon-x; circle-x conveys the same "error" meaning for the toast icon) |
| `Loader2Icon` | `IconLoader2` |
| `Heart` | `IconHeart` |
| `MessageCircle` | `IconMessageCircle` |
| `MoreHorizontal` | `IconDots` |
| `Flag` | `IconFlag` |
| `BarChart3` | `IconChartBar` |
| `Link2` | `IconLink` |
| `Flame` | `IconFlame` |
| `PenSquare` | `IconEdit` (Tabler has no pen-square; edit conveys the same "compose/write" affordance) |
| `ArrowLeft` | `IconArrowLeft` |
| `X` / `XIcon` | `IconX` |
| `ImageIcon` | `IconPhoto` |
| `VenetianMask` | **keep as a custom inline SVG — see Step-by-step below, do not map to a Tabler icon.** Tabler has no masquerade-mask icon, and the mask glyph is this product's specific visual signal for anonymity (DESIGN-SYSTEM.md §3) — substituting an unrelated icon would weaken that signal. |

- [ ] **Step 1: Install the new dependency**

Run: `cd apps/web && npm install @tabler/icons-react@^3`
Expected: `package.json` `dependencies` gains `"@tabler/icons-react": "^3.x.x"`.

- [ ] **Step 2: Create the shared VenetianMask replacement**

Create `apps/web/src/components/shestays/icons/mask-icon.tsx`:

```tsx
export function MaskIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 8.5c2-2 4.5-3 9-3s7 1 9 3c0 5-2 9-9 9s-9-4-9-9Z" />
      <path d="M7 10.5c1-1 2-1 2.5 0" />
      <path d="M14.5 10.5c1-1 2-1 2.5 0" />
      <path d="M9.5 15c1 .8 4 .8 5 0" />
    </svg>
  );
}
```

- [ ] **Step 3: Edit each file — replace the lucide-react import and rename usages**

For every file below, replace the exact import line shown, then rename every JSX usage of the old identifier(s) in that same file to the new identifier(s) from the mapping table (each old name only appears where the import brought it in, so this is unambiguous). For any file importing `VenetianMask`, also add `import { MaskIcon } from "@/components/shestays/icons/mask-icon";` and replace every `<VenetianMask ... />` usage with `<MaskIcon ... />` (same props/className, just the tag name changes).

  - `apps/web/src/components/ui/dialog.tsx:8`
    - Old: `import { XIcon } from "lucide-react"`
    - New: `import { IconX } from "@tabler/icons-react"`
    - Rename JSX usage `<XIcon />` → `<IconX />` (line ~73).

  - `apps/web/src/app/notifications/page.tsx:5`
    - Old: `import { MessageSquare, ArrowUpCircle, AtSign, ShieldCheck } from "lucide-react";`
    - New: `import { IconMessage, IconCircleArrowUp, IconAt, IconShieldCheck } from "@tabler/icons-react";`
    - Rename `MessageSquare`→`IconMessage`, `ArrowUpCircle`→`IconCircleArrowUp`, `AtSign`→`IconAt`, `ShieldCheck`→`IconShieldCheck` at every JSX usage in the file.

  - `apps/web/src/components/shestays/app-shell.tsx:5`
    - Old: `import { Home, Search, Bell, User } from "lucide-react";`
    - New: `import { IconHome, IconSearch, IconBell, IconUser } from "@tabler/icons-react";`
    - Rename in the `MOBILE_NAV_ITEMS` array (`icon: Home` → `icon: IconHome`, etc.) and any direct JSX usage.

  - `apps/web/src/app/search/page.tsx:6`
    - Old: `import { Search as SearchIcon, Plus } from "lucide-react";`
    - New: `import { IconSearch, IconPlus } from "@tabler/icons-react";`
    - Rename `<SearchIcon />` → `<IconSearch />`, `<Plus />` → `<IconPlus />`.

  - `apps/web/src/components/shestays/anonymous-tag.tsx:1`
    - Old: `import { VenetianMask } from "lucide-react";`
    - New: `import { MaskIcon } from "@/components/shestays/icons/mask-icon";`
    - Rename `<VenetianMask />` → `<MaskIcon />`.

  - `apps/web/src/components/shestays/anonymous-toggle.tsx:3`
    - Old: `import { VenetianMask, User } from "lucide-react";`
    - New: `import { IconUser } from "@tabler/icons-react";` and `import { MaskIcon } from "@/components/shestays/icons/mask-icon";`
    - Rename `<VenetianMask />` → `<MaskIcon />`, `<User />` → `<IconUser />`.

  - `apps/web/src/components/shestays/mobile-post-fab.tsx:5`
    - Old: `import { VenetianMask, Plus } from "lucide-react";`
    - New: `import { IconPlus } from "@tabler/icons-react";` and `import { MaskIcon } from "@/components/shestays/icons/mask-icon";`
    - Rename `<VenetianMask />` → `<MaskIcon />`, `<Plus />` → `<IconPlus />`.

  - `apps/web/src/components/shestays/nearby-pgs-panel.tsx:5`
    - Old: `import { MapPin } from "lucide-react";`
    - New: `import { IconMapPin } from "@tabler/icons-react";`
    - Rename `<MapPin />` → `<IconMapPin />`.

  - `apps/web/src/components/ui/dropdown-menu.tsx:6`
    - Old: `import { ChevronRightIcon, CheckIcon } from "lucide-react"`
    - New: `import { IconChevronRight, IconCheck } from "@tabler/icons-react"`
    - Rename `<ChevronRightIcon />` → `<IconChevronRight />`, `<CheckIcon />` → `<IconCheck />`.

  - `apps/web/src/components/ui/select.tsx:6`
    - Old: `import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"`
    - New: `import { IconChevronDown, IconCheck, IconChevronUp } from "@tabler/icons-react"`
    - Rename accordingly at each usage.

  - `apps/web/src/components/shestays/feed-post-card.tsx:2`
    - Old: `import { Users2 } from "lucide-react";`
    - New: `import { IconUsersGroup } from "@tabler/icons-react";`
    - Rename `<Users2 />` → `<IconUsersGroup />`.

  - `apps/web/src/app/profile/page.tsx:4`
    - Old: `import { MapPin, Home as HomeIcon, Bookmark } from "lucide-react";`
    - New: `import { IconMapPin, IconHome, IconBookmark } from "@tabler/icons-react";`
    - Rename `<MapPin />` → `<IconMapPin />`, `<HomeIcon />` → `<IconHome />`, `<Bookmark />` → `<IconBookmark />`.

  - `apps/web/src/components/shestays/my-pgs-list.tsx:6`
    - Old: `import { Home } from "lucide-react";`
    - New: `import { IconHome } from "@tabler/icons-react";`
    - Rename `<Home />` → `<IconHome />`.

  - `apps/web/src/components/shestays/my-communities-list.tsx:5`
    - Old: `import { Users2, MapPin } from "lucide-react";`
    - New: `import { IconUsersGroup, IconMapPin } from "@tabler/icons-react";`
    - Rename accordingly.

  - `apps/web/src/components/ui/sonner.tsx:5`
    - Old: `import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"`
    - New: `import { IconCircleCheck, IconInfoCircle, IconAlertTriangle, IconCircleX, IconLoader2 } from "@tabler/icons-react"`
    - Rename accordingly at each usage.

  - `apps/web/src/components/shestays/quick-post-card.tsx:5`
    - Old: `import { VenetianMask, ChevronDown, Plus } from "lucide-react";`
    - New: `import { IconChevronDown, IconPlus } from "@tabler/icons-react";` and `import { MaskIcon } from "@/components/shestays/icons/mask-icon";`
    - Rename `<VenetianMask />` → `<MaskIcon />`, `<ChevronDown />` → `<IconChevronDown />`, `<Plus />` → `<IconPlus />`.

  - `apps/web/src/app/page.tsx:6`
    - Old: `import { Search } from "lucide-react";`
    - New: `import { IconSearch } from "@tabler/icons-react";`
    - Rename `<Search />` → `<IconSearch />`.

  - `apps/web/src/components/shestays/pg-card.tsx:2`
    - Old: `import { Star, Users, MessageSquare } from "lucide-react";`
    - New: `import { IconStar, IconUsers, IconMessage } from "@tabler/icons-react";`
    - Rename accordingly.

  - `apps/web/src/components/shestays/sidebar-extras.tsx:2`
    - Old: `import { Bookmark, Clock } from "lucide-react";`
    - New: `import { IconBookmark, IconClock } from "@tabler/icons-react";`
    - Rename accordingly.

  - `apps/web/src/components/shestays/pg-list-row.tsx:2`
    - Old: `import { Users } from "lucide-react";`
    - New: `import { IconUsers } from "@tabler/icons-react";`
    - Rename `<Users />` → `<IconUsers />`.

  - `apps/web/src/components/shestays/pg-picker-dialog.tsx:6`
    - Old: `import { Search } from "lucide-react";`
    - New: `import { IconSearch } from "@tabler/icons-react";`
    - Rename `<Search />` → `<IconSearch />`.

  - `apps/web/src/components/shestays/top-nav.tsx:6`
    - Old: `import { Search, Bell, ChevronDown } from "lucide-react";`
    - New: `import { IconSearch, IconBell, IconChevronDown } from "@tabler/icons-react";`
    - Rename accordingly.

  - `apps/web/src/components/shestays/rating-tag-chip.tsx:1`
    - Old: `import { Star } from "lucide-react";`
    - New: `import { IconStar } from "@tabler/icons-react";`
    - Rename `<Star />` → `<IconStar />`.

  - `apps/web/src/components/shestays/post-card.tsx:6`
    - Old: `import { Heart, MessageCircle, MoreHorizontal, Bookmark, Flag, BarChart3, Check, Link2 } from "lucide-react";`
    - New: `import { IconHeart, IconMessageCircle, IconDots, IconBookmark, IconFlag, IconChartBar, IconCheck, IconLink } from "@tabler/icons-react";`
    - Rename accordingly at each usage.

  - `apps/web/src/components/shestays/trending-discussions-panel.tsx:5`
    - Old: `import { Flame } from "lucide-react";`
    - New: `import { IconFlame } from "@tabler/icons-react";`
    - Rename `<Flame />` → `<IconFlame />`.

  - `apps/web/src/app/pg/[id]/page.tsx:6`
    - Old: `import { Star, Users, MapPin, PenSquare } from "lucide-react";`
    - New: `import { IconStar, IconUsers, IconMapPin, IconEdit } from "@tabler/icons-react";`
    - Rename accordingly.

  - `apps/web/src/app/pg/[id]/compose/page.tsx:7`
    - Old: `import { ArrowLeft, X, ImageIcon, Link2 } from "lucide-react";`
    - New: `import { IconArrowLeft, IconX, IconPhoto, IconLink } from "@tabler/icons-react";`
    - Rename accordingly.

  - `apps/web/src/components/shestays/vote-control.tsx:3`
    - Old: `import { ChevronUp, ChevronDown } from "lucide-react";`
    - New: `import { IconChevronUp, IconChevronDown } from "@tabler/icons-react";`
    - Rename `<ChevronUp />` → `<IconChevronUp />`, `<ChevronDown />` → `<IconChevronDown />`.

  - `apps/web/src/app/pg/[id]/post/[postId]/page.tsx:6`
    - Old: `import { ArrowLeft } from "lucide-react";`
    - New: `import { IconArrowLeft } from "@tabler/icons-react";`
    - Rename `<ArrowLeft />` → `<IconArrowLeft />`.

- [ ] **Step 4: Remove the old dependency**

In `apps/web/package.json`, remove the line:
```json
    "lucide-react": "^1.43.0",
```
Run: `cd apps/web && npm install` to update the lockfile.

- [ ] **Step 5: Verify the build**

Run: `cd apps/web && npm run build`
Expected: build succeeds. If any file still imports from `lucide-react`, this will fail with a module-not-found error — that's the loud failure the spec requires; fix the missed file and re-run.

- [ ] **Step 6: Verify lint**

Run: `cd apps/web && npm run lint`
Expected: no unused-import errors (every old import line was fully replaced, not left alongside the new one).

- [ ] **Step 7: Visually verify in the browser**

Open the dev server and check: top nav search/bell icons render, post like/comment/save/flag icons render, the anonymous mask icon still renders on the "Post anonymously" toggle and on anonymous post author tags, vote arrows render on any page using `VoteControl`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Swap icon set from lucide-react to @tabler/icons-react"
```

---

### Task 4: Branded shimmer skeleton + spinner

**Files:**
- Modify: `apps/web/src/components/ui/skeleton.tsx`
- Modify: `apps/web/src/app/globals.css`
- Create: `apps/web/src/components/ui/spinner.tsx`
- Modify: `apps/web/src/components/shestays/post-card.tsx`

**Interfaces:**
- Produces: `Spinner` component — `function Spinner({ className }: { className?: string }): JSX.Element`, renders an inline `<svg>` with `animate-spin`.
- Consumes (Skeleton): no prop changes — same `className` passthrough API as before, so every existing `<Skeleton className="..." />` call site elsewhere in the app benefits automatically with zero changes to those call sites.

- [ ] **Step 1: Add the shimmer keyframe**

In `apps/web/src/app/globals.css`, add this new block right after the existing `@utility scrollbar-hide { ... }` block at the end of the file:

```css
@utility animate-shimmer {
  position: relative;
  overflow: hidden;
  background-color: var(--muted);
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in oklab, var(--ss-primary-soft) 70%, transparent),
      transparent
    );
    animation: shimmer-sweep 1.6s ease-in-out infinite;
  }
}

@keyframes shimmer-sweep {
  100% {
    transform: translateX(100%);
  }
}
```

- [ ] **Step 2: Update the Skeleton component**

Current `apps/web/src/components/ui/skeleton.tsx`:

```tsx
import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

Change the className from `"animate-pulse rounded-md bg-muted"` to `"animate-shimmer rounded-md"` (the shimmer utility now owns the background color, so `bg-muted` is redundant and removed):

```tsx
import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-shimmer rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

- [ ] **Step 3: Create the Spinner component**

Create `apps/web/src/components/ui/spinner.tsx`:

```tsx
import { cn } from "cn"

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 animate-spin text-current", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export { Spinner }
```

- [ ] **Step 4: Wire the Spinner into the post like button's pending state**

In `apps/web/src/components/shestays/post-card.tsx`, find the like button (around line 245-254):

```tsx
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 gap-1.5", isLiked ? "text-danger" : "text-muted-foreground")}
          onClick={() => likeMutation.mutate()}
          aria-pressed={isLiked}
        >
          <Heart className={cn("size-4", isLiked && "fill-current")} />
          {post.upvotes}
        </Button>
```

Replace with (swap the icon for a Spinner while the mutation is in flight, and add the `Spinner` import alongside the existing Tabler imports from Task 3):

```tsx
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 gap-1.5", isLiked ? "text-danger" : "text-muted-foreground")}
          onClick={() => likeMutation.mutate()}
          aria-pressed={isLiked}
          disabled={likeMutation.isPending}
        >
          {likeMutation.isPending ? (
            <Spinner className="size-4" />
          ) : (
            <IconHeart className={cn("size-4", isLiked && "fill-current")} />
          )}
          {post.upvotes}
        </Button>
```

Add `import { Spinner } from "@/components/ui/spinner";` to the top of `post-card.tsx` alongside its other imports.

- [ ] **Step 5: Verify build**

Run: `cd apps/web && npm run build` — expect success.

- [ ] **Step 6: Visually verify**

In the dev server, confirm any loading skeleton (e.g. refresh the home feed) now shows a pink-tinted shimmer sweep instead of a flat gray pulse. Click a post's like button and confirm a brief spinner replaces the heart icon while the mock mutation resolves (the mock API has an artificial delay, so this should be visible).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/components/ui/skeleton.tsx apps/web/src/components/ui/spinner.tsx apps/web/src/components/shestays/post-card.tsx
git commit -m "Replace flat skeleton pulse with branded shimmer, add Spinner for pending states"
```

---

### Task 5: Empty-state doodle illustrations

**Files:**
- Create: `apps/web/src/components/shestays/illustrations/empty-feed.tsx`
- Create: `apps/web/src/components/shestays/illustrations/empty-notifications.tsx`
- Create: `apps/web/src/components/shestays/illustrations/empty-search.tsx`
- Create: `apps/web/src/components/shestays/illustrations/empty-saved.tsx`
- Create: `apps/web/src/components/shestays/empty-state.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/notifications/page.tsx`
- Modify: `apps/web/src/app/search/page.tsx`
- Modify: `apps/web/src/app/profile/page.tsx`

**Interfaces:**
- Produces: `EmptyState` — `function EmptyState({ illustration, title, action }: { illustration: React.ReactNode; title: string; action?: React.ReactNode }): JSX.Element`.
- Produces: four illustration components, each `function EmptyXDoodle({ className }: { className?: string }): JSX.Element`, single-color line art using `currentColor` so they inherit `text-muted-foreground` (or any color the caller sets) rather than being hard-coded to one brand color.

- [ ] **Step 1: Create the four doodle SVGs**

Create `apps/web/src/components/shestays/illustrations/empty-feed.tsx`:

```tsx
export function EmptyFeedDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" className={className} aria-hidden="true">
      <rect x="16" y="18" width="72" height="52" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M28 34h48M28 44h48M28 54h30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M76 66c8 2 16 8 20 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="86" r="3" fill="currentColor" />
    </svg>
  );
}
```

Create `apps/web/src/components/shestays/illustrations/empty-notifications.tsx`:

```tsx
export function EmptyNotificationsDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" className={className} aria-hidden="true">
      <path
        d="M60 20c-11 0-18 8-18 20v14l-8 12h52l-8-12V40c0-12-7-20-18-20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M52 74a8 8 0 0 0 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M84 26c4 3 6 7 6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
```

Create `apps/web/src/components/shestays/illustrations/empty-search.tsx`:

```tsx
export function EmptySearchDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" className={className} aria-hidden="true">
      <circle cx="50" cy="46" r="24" stroke="currentColor" strokeWidth="2" />
      <path d="M68 64l20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 46c2-6 8-9 14-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
```

Create `apps/web/src/components/shestays/illustrations/empty-saved.tsx`:

```tsx
export function EmptySavedDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" className={className} aria-hidden="true">
      <path
        d="M42 16h36c2 0 3 1 3 3v58l-21-14-21 14V19c0-2 1-3 3-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M20 40c-4 2-6 6-5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
```

- [ ] **Step 2: Create the shared EmptyState component**

Create `apps/web/src/components/shestays/empty-state.tsx`:

```tsx
export function EmptyState({
  illustration,
  title,
  action,
}: {
  illustration: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
      <div className="size-24 text-muted-foreground">{illustration}</div>
      <p className="text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}
```

- [ ] **Step 3: Wire into the home feed empty state**

In `apps/web/src/app/page.tsx`, add the import:

```tsx
import { EmptyState } from "@/components/shestays/empty-state";
import { EmptyFeedDoodle } from "@/components/shestays/illustrations/empty-feed";
```

Find:

```tsx
        {visibleFeed?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nothing here yet — be the first to post from a PG&apos;s place page.
          </p>
        )}
```

Replace with:

```tsx
        {visibleFeed?.length === 0 && (
          <EmptyState
            illustration={<EmptyFeedDoodle className="size-full" />}
            title="Nothing here yet — be the first to post from a PG's place page."
          />
        )}
```

- [ ] **Step 4: Wire into the notifications empty state**

In `apps/web/src/app/notifications/page.tsx`, add the import:

```tsx
import { EmptyState } from "@/components/shestays/empty-state";
import { EmptyNotificationsDoodle } from "@/components/shestays/illustrations/empty-notifications";
```

Find:

```tsx
        {notifications?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        )}
```

Replace with:

```tsx
        {notifications?.length === 0 && (
          <EmptyState
            illustration={<EmptyNotificationsDoodle className="size-full" />}
            title="No notifications yet."
          />
        )}
```

- [ ] **Step 5: Wire into the search empty state**

In `apps/web/src/app/search/page.tsx`, add the import:

```tsx
import { EmptyState } from "@/components/shestays/empty-state";
import { EmptySearchDoodle } from "@/components/shestays/illustrations/empty-search";
```

Find:

```tsx
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">Can&apos;t find &quot;{query}&quot;.</p>
            <Button
              className="mt-3 gap-1.5"
              onClick={() => {
                setNewName(query);
                setAddOpen(true);
              }}
            >
              <Plus className="size-4" />
```

Replace the wrapping `<div>` and text `<p>` with `EmptyState`, keeping the existing `Button` (with its icon renamed to `IconPlus` per Task 3) as the `action`:

```tsx
          <EmptyState
            illustration={<EmptySearchDoodle className="size-full" />}
            title={`Can't find "${query}".`}
            action={
              <Button
                className="mt-1 gap-1.5"
                onClick={() => {
                  setNewName(query);
                  setAddOpen(true);
                }}
              >
                <IconPlus className="size-4" />
```

Keep the rest of that `Button`'s existing children and closing tags exactly as they are today — only the two opening wrapper elements (`<div className="rounded-2xl...">` and the `<p>`) are removed, replaced by `<EmptyState ...>` and its `action` prop opening, and the old closing `</div>` becomes `</EmptyState>`.

- [ ] **Step 6: Wire into the profile "Saved PGs" empty state**

In `apps/web/src/app/profile/page.tsx`, add the import:

```tsx
import { EmptyState } from "@/components/shestays/empty-state";
import { EmptySavedDoodle } from "@/components/shestays/illustrations/empty-saved";
```

Find:

```tsx
            ) : (
              <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Nothing saved yet — tap Save on any post to keep it here.
              </p>
            )}
```

(this is the second, "Saved PGs" occurrence of this pattern in the file — the first one, "No PGs yet — join one...", stays a plain paragraph, no illustration, per the spec's 4-illustration scope).

Replace with:

```tsx
            ) : (
              <EmptyState
                illustration={<EmptySavedDoodle className="size-full" />}
                title="Nothing saved yet — tap Save on any post to keep it here."
              />
            )}
```

- [ ] **Step 7: Verify build**

Run: `cd apps/web && npm run build` — expect success.

- [ ] **Step 8: Visually verify each empty state**

- Home: filter to "Polls" if no poll posts exist in the mock data (check `apps/web/src/lib/mock-data.ts` for what post types exist — filter to whichever type has zero posts) and confirm the feed doodle + message renders.
- Notifications: not easily emptiable via mock data without editing it — visually inspect the component renders correctly by temporarily forcing `notifications?.length === 0` to `true` in a local scratch edit, confirm rendering, then revert (do not commit a temporary test hack).
- Search: type a nonsense query like "zzz-no-match" and confirm the doodle + "Add this PG" button both render.
- Profile: if the mock profile has saved PGs, temporarily note this is visually unverifiable without mock-data changes — skip live verification here and rely on the build/lint pass plus code review of the JSX structure.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/components/shestays/illustrations apps/web/src/components/shestays/empty-state.tsx apps/web/src/app/page.tsx apps/web/src/app/notifications/page.tsx apps/web/src/app/search/page.tsx apps/web/src/app/profile/page.tsx
git commit -m "Add doodle illustrations to empty states"
```

---

### Task 6: Favicon

**Files:**
- Create: `apps/web/src/app/icon.tsx`
- Create: `apps/web/src/app/apple-icon.tsx`
- Delete: `apps/web/src/app/favicon.ico` (superseded by the dynamic `icon.tsx` convention below — Next.js App Router prefers `icon.tsx`/`icon.png` over the static `favicon.ico` when both are present, so leaving the old default-Next.js icon in place would be dead weight, not a fallback)

**Interfaces:**
- Produces: Next.js App Router auto-detects `icon.tsx` and `apple-icon.tsx` as special files and serves them at `/icon` and `/apple-icon` with the correct `<link rel="icon">`/`<link rel="apple-touch-icon">` tags injected automatically — no manual `<head>` wiring needed, and no metadata.ts changes required.

- [ ] **Step 1: Create the favicon**

Create `apps/web/src/app/icon.tsx`:

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F82A78",
          borderRadius: 6,
          color: "#FFFFFF",
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: Create the Apple touch icon**

Create `apps/web/src/app/apple-icon.tsx`:

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F82A78",
          borderRadius: 32,
          color: "#FFFFFF",
          fontSize: 96,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 3: Remove the old static favicon**

Delete `apps/web/src/app/favicon.ico` (the default Next.js placeholder icon it shipped with).

- [ ] **Step 4: Verify build**

Run: `cd apps/web && npm run build` — expect success (Next.js needs `next/og`'s `ImageResponse`, bundled with Next.js itself, no new dependency required).

- [ ] **Step 5: Visually verify**

Start the dev server, open `http://localhost:3000/icon` directly in the browser — confirm it renders a pink square with a white "S". Check the browser tab favicon updates to this mark (may require a hard refresh / clearing the favicon cache).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/icon.tsx apps/web/src/app/apple-icon.tsx
git rm apps/web/src/app/favicon.ico
git commit -m "Replace default Next.js favicon with brand-mark icon.tsx/apple-icon.tsx"
```

---

### Task 7: Rewrite DESIGN-SYSTEM.md to match the shipped UI

**Files:**
- Modify: `docs/DESIGN-SYSTEM.md`

**Interfaces:** None — documentation only.

- [ ] **Step 1: Rewrite §2's shape-language line**

Current (last bullet of §2):
```
- Rounded-pill category filters, soft card shadows, and the pill-shaped primary button are carried through directly — they match the brand's rounded, soft, non-corporate feel and suit --color-primary well.
```
Replace with:
```
- Sharp-cornered filter tabs, flat 1px-border cards, and a sharp-cornered primary button replace the original reference UI's rounded-pill carryover (see §6) — the brand pink is now the sole source of warmth, expressed through restrained color use and typography rather than rounded chrome.
```

- [ ] **Step 2: Rewrite §6's radius guidance**

Current §6:
```
## 6. Tone/feel
- Soft, warm, non-corporate — rounded corners throughout (cards 16-20px, buttons full-pill), generous whitespace, `--color-background` (warm off-white) rather than stark white behind content, `--color-surface` for cards.
- Primary pink used sparingly and intentionally: primary actions, active states, and the brand accent — not as a background flood — so it reads premium rather than loud.
- Anonymous elements deliberately desaturated (gray, not pink) so the product visually signals "safe, neutral, judgment-free" at the exact moment someone chooses to speak freely.
```
Replace with:
```
## 6. Tone/feel
- Sharp, modern, premium — near-square corners throughout (cards/dialogs ~5-8px, buttons/chips/inputs 2-4px; see the `--radius` token in `apps/web/src/app/globals.css`), 1px solid borders doing more visual work than soft shadow, generous whitespace, `--color-background` (warm off-white) rather than stark white behind content, `--color-surface` for cards. Circular UI conventions (avatars, icon-only circular buttons, toggle switches, vote-arrow buttons) stay circular — the sharp-corner pivot applies to pill/chip/card/button chrome, not to elements that are functionally circles.
- Primary pink used sparingly and intentionally: primary actions, active states, and the brand accent — not as a background flood — so it reads premium rather than loud.
- Anonymous elements deliberately desaturated (gray, not pink) so the product visually signals "safe, neutral, judgment-free" at the exact moment someone chooses to speak freely. The anonymity mask icon (`components/shestays/icons/mask-icon.tsx`) is a custom glyph, not part of the Tabler icon set used everywhere else, so it stays visually distinct as this product's specific anonymity signal.
- Empty states (no posts, no notifications, no search results, no saved PGs) use a small single-color line-doodle illustration (`components/shestays/illustrations/`) plus a one-line message, rather than plain text alone — this is the only place illustration is used; it is not a decorative accent elsewhere in the product.
```

- [ ] **Step 3: Commit**

```bash
git add docs/DESIGN-SYSTEM.md
git commit -m "Update DESIGN-SYSTEM.md to describe the sharp-corner visual refresh"
```

---

### Task 8: Mobile performance verification pass

This task is a verification checklist, not new feature code — it runs after Tasks 1-7 have landed.

**Files:** None modified unless an issue is found (in which case, fix in the relevant file from Tasks 1-7 and re-run this checklist).

- [ ] **Step 1: Lighthouse audit — Home**

With `npm run build && npm run start` running (production build, not dev server — dev mode skews performance numbers), open Chrome DevTools → Lighthouse → Mobile → run against `http://localhost:3000/`. Record the Performance score.

- [ ] **Step 2: Lighthouse audit — PG place page**

Run the same audit against a PG place page URL, e.g. `http://localhost:3000/pg/pg-1`. Record the Performance score.

- [ ] **Step 3: Compare against pre-refresh baseline**

If a baseline score isn't already known, run the same two audits against the commit immediately before Task 1 (`git stash` or check out the prior commit in a scratch worktree) for comparison. The icon-library swap and new SVG assets should not regress the score by more than a couple of points — Tabler and lucide are both tree-shaken icon sets of similar per-icon size, and the doodle SVGs are small inline components, not image files.

- [ ] **Step 4: Verify tree-shaking on the icon import**

Run: `cd apps/web && npm run build` and inspect the build output's route sizes (Next.js prints a First Load JS table). Confirm no route's JS size jumped dramatically compared to before Task 3 — if it did, check for any `import * as Icons from "@tabler/icons-react"` (wildcard import) accidentally introduced instead of named imports; there should be none per Task 3's per-icon import list.

- [ ] **Step 5: Re-confirm tap targets on mobile**

Resize the browser (or use device emulation) to a 375px-wide mobile viewport. Check the bottom tab bar icons, the mobile FAB, and the mobile "Post anonymously" toggle all still have at least a 44x44px tappable area — Task 2 only changed `rounded-*` class names, never `size-*`/`p-*`/`h-*`, so this should already hold; this step is a confirmation, not expected to require a fix.

- [ ] **Step 6: Record findings**

No commit for this task unless Step 3-5 surface a regression requiring a code fix — if so, make the fix in the appropriate file from Tasks 1-7, verify the build, and commit with a message describing the specific regression fixed (e.g. "Fix bundle-size regression from wildcard Tabler import in X").

---

## Self-Review Notes (for whoever executes this plan)

- Every §-numbered item in the spec (docs/superpowers/specs/2026-09-13-visual-refresh-design.md) maps to a task: §3.1→Tasks 1-2, §3.2→Task 3, §3.3→Task 5, §3.4→Task 6, §3.5→Task 4, §3.6→Task 7, §7→Task 8.
- The spec's §3.1 component list (Button, FilterPillBar, PostCard, etc.) is fully covered: components using token-derived radius classes (`rounded-lg`/`xl`/`2xl`) needed no individual edits (Task 1 alone fixes them); components with hard-coded `rounded-full` overrides are each listed explicitly in Task 2.
- `PgListRow`, `SuggestedPgsPanel`, and `NearbyPgsPanel` are currently unused on the home page (removed from `page.tsx` in a prior session) but still exist and are reachable from other code paths if reintroduced — they use only token-driven radius classes, so Task 1 covers them with no extra work; they're intentionally not listed as needing individual edits.
