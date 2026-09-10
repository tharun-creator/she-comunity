# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the missing admin/moderation surface for SheStays Community — a reports queue, PG visibility management, and basic user suspend/reinstate — as a new `/admin` section of `apps/web`.

**Architecture:** Three sibling routes (`/admin/reports`, `/admin/pgs`, `/admin/users`) under a shared `layout.tsx` that gates access with a hardcoded allowlist (`AdminGuard`) and wraps content in a dark, pink-accented shell (`AdminShell`) distinct from the rest of the light-themed app. Each page is a self-contained master-detail view (row list + detail panel, selection tracked via a `?selected=<id>` query param) backed by new functions added to the existing mock data layer, following its established async-signature convention.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React, TanStack Query v5, Tailwind v4 (existing SheStays design tokens), shadcn/ui primitives already in the repo (`Button`, `Skeleton`), `sonner` for toasts.

**Spec:** `docs/superpowers/specs/2026-09-10-admin-panel-design.md`

## Global Constraints

- No real authentication exists in the app. The `ADMIN_USER_IDS` allowlist is a UI-only gate, not a security boundary — document this in code, don't pretend otherwise.
- Stay on the mock data layer (`apps/web/src/lib/mock-data.ts`). Do not wire to the live Supabase DB in this pass.
- No test framework is configured in `apps/web` (no `test` script, no runner installed). Verification is manual: `npx tsc --noEmit` for pure data-layer changes with no UI yet, and dev-server interaction (via the Browser tool) once a task has a UI to click through.
- Match existing design tokens exactly (`bg-card`, `border-border`, `text-heading`, `text-muted-foreground`, `bg-primary`, etc.) — no new colors outside the existing `.dark` theme block in `globals.css`.
- No new generic/shared abstraction beyond `AdminShell` and `AdminStatCard` (both presentational, not data-shape-specific). The three admin pages are written independently, not through a shared "master-detail" component — see spec's Components section for why.
- Every new/modified `.ts`/`.tsx` file must pass `npx tsc --noEmit` with no new errors before that task's commit.

---

### Task 1: Add `isSuspended` to `UserProfile`

**Files:**
- Modify: `apps/web/src/types/domain.ts:121-126`

**Interfaces:**
- Produces: `UserProfile.isSuspended?: boolean` — consumed by Task 4's `AdminUserSummary`.

- [ ] **Step 1: Add the field**

In `apps/web/src/types/domain.ts`, the `UserProfile` interface currently reads:

```ts
export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  city: string;
  pgsLivedAt: string[];
  savedPgIds: string[];
  joinedPgIds: string[];
  accountCreatedAt: string;
}
```

Add one field so it reads:

```ts
export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  city: string;
  pgsLivedAt: string[];
  savedPgIds: string[];
  joinedPgIds: string[];
  accountCreatedAt: string;
  /** Admin moderation flag. Undefined/false = active account. */
  isSuspended?: boolean;
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors (this is an additive optional field, nothing else references it yet).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/types/domain.ts
git commit -m "feat(admin): add isSuspended flag to UserProfile"
```

---

### Task 2: Reports backing store — `fetchReports`, `resolveReport`, real `reportContent`

**Files:**
- Modify: `apps/web/src/lib/mock-data.ts:1` (import line)
- Modify: `apps/web/src/lib/mock-data.ts:250-252` (insert reports store after `notifications` array)
- Modify: `apps/web/src/lib/mock-data.ts:483-486` (replace `reportContent` body, append two new functions)

**Interfaces:**
- Consumes: `Report`, `ReportReason` types from `@/types/domain` (already defined, unchanged).
- Produces: `fetchReports(): Promise<Report[]>`, `resolveReport(id: string, status: "actioned" | "dismissed"): Promise<Report>`, and a `reportContent` that now actually persists — all consumed by Task 9 (`app/admin/reports/page.tsx`) and by the existing `report-modal.tsx` (no signature change there, so it keeps working unmodified).

- [ ] **Step 1: Import the `Report`/`ReportReason` types**

In `apps/web/src/lib/mock-data.ts`, line 1 currently reads:

```ts
import type { AppNotification, ChennaiArea, Comment, Pg, Post, UserProfile } from "@/types/domain";
```

Change to:

```ts
import type { AppNotification, ChennaiArea, Comment, Pg, Post, Report, ReportReason, UserProfile } from "@/types/domain";
```

- [ ] **Step 2: Add the `reports` backing store and a target-author helper**

Find this block (currently lines 249-252):

```ts
];

const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));
```

That `];` closes the `notifications` array. Insert the new `reports` array and a helper function between it and `delay`, so it reads:

```ts
];

// Seeded so the admin reports queue isn't empty on first load — one pending,
// one already actioned, matching the moderation flow described in PRD §5.5.
const reports: Report[] = [
  {
    id: "report-1",
    targetType: "post",
    targetId: "post-2",
    reason: "harassment",
    detail: "Feels like this could identify the warden unfairly to other residents.",
    status: "pending",
    createdAt: hoursAgo(6),
  },
  {
    id: "report-2",
    targetType: "comment",
    targetId: "c-2",
    reason: "other",
    detail: "Flagging for review, not sure it needs action.",
    status: "actioned",
    createdAt: hoursAgo(30),
  },
];

// Seed content has no real author id — named (non-anonymous) authors are only
// ever identified by displayName. Used by fetchAllUsersAdmin (Task 4) to
// correlate a report to the account it targets.
function targetAuthorDisplayName(report: Report): string | null {
  const target =
    report.targetType === "post"
      ? posts.find((p) => p.id === report.targetId)
      : comments.find((c) => c.id === report.targetId);
  if (!target || target.author.isAnonymous) return null;
  return target.author.displayName ?? null;
}

const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));
```

- [ ] **Step 3: Replace `reportContent` and add `fetchReports` / `resolveReport`**

Find the current `reportContent` (lines 483-486):

```ts
export async function reportContent(input: { targetType: "post" | "comment"; targetId: string; reason: string; detail?: string }) {
  await delay(300);
  return { ok: true, ...input };
}
```

Replace it with:

```ts
export async function reportContent(input: {
  targetType: "post" | "comment";
  targetId: string;
  reason: ReportReason;
  detail?: string;
}) {
  await delay(300);
  reports.unshift({
    id: `report-${reports.length + 1}`,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    detail: input.detail,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  return { ok: true as const, ...input };
}

export async function fetchReports(): Promise<Report[]> {
  await delay();
  return [...reports].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function resolveReport(id: string, status: "actioned" | "dismissed"): Promise<Report> {
  await delay(150);
  const report = reports.find((r) => r.id === id);
  if (!report) throw new Error("Report not found");
  report.status = status;
  return report;
}
```

- [ ] **Step 4: Verify**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors. `report-modal.tsx` still calls `reportContent({ targetType, targetId, reason, detail })` with the same shape, so it compiles unchanged.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/mock-data.ts
git commit -m "feat(admin): back reports with real persistence, add fetchReports/resolveReport"
```

---

### Task 3: PG admin fetch + visibility toggle

**Files:**
- Modify: `apps/web/src/lib/mock-data.ts` (insert after `fetchDiscoverFeed`, currently ending at line 258)

**Interfaces:**
- Produces: `fetchAllPgsAdmin(): Promise<Pg[]>`, `setPgVisibility(pgId: string, visible: boolean): Promise<Pg>` — consumed by Task 10 (`app/admin/pgs/page.tsx`).

- [ ] **Step 1: Add the two functions**

Find `fetchDiscoverFeed` (lines 254-258):

```ts
export async function fetchDiscoverFeed(area?: ChennaiArea | "All") {
  await delay();
  const filtered = area && area !== "All" ? pgs.filter((p) => p.area === area) : pgs;
  return filtered.filter((p) => p.isPubliclyVisible).sort((a, b) => b.reviewCount - a.reviewCount);
}
```

Insert directly after its closing `}`:

```ts

// Unlike fetchDiscoverFeed, does not filter by isPubliclyVisible — admin
// needs to see PGs below the PRD §11 threshold too.
export async function fetchAllPgsAdmin(): Promise<Pg[]> {
  await delay();
  return [...pgs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function setPgVisibility(pgId: string, visible: boolean): Promise<Pg> {
  await delay(150);
  const pg = pgs.find((p) => p.id === pgId);
  if (!pg) throw new Error("PG not found");
  pg.isPubliclyVisible = visible;
  return pg;
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/mock-data.ts
git commit -m "feat(admin): add fetchAllPgsAdmin and setPgVisibility"
```

---

### Task 4: User roster with suspend/reinstate

**Files:**
- Modify: `apps/web/src/lib/mock-data.ts` (insert after `fetchProfile`, currently ending at line 391)

**Interfaces:**
- Consumes: `UserProfile.isSuspended` (Task 1), `targetAuthorDisplayName` (Task 2), module-level `posts`/`reports`/`currentUser` arrays already in this file.
- Produces: `AdminUserSummary` interface, `fetchAllUsersAdmin(): Promise<AdminUserSummary[]>`, `setUserSuspended(userId: string, suspended: boolean): Promise<AdminUserSummary>` — consumed by Task 11 (`app/admin/users/page.tsx`).

- [ ] **Step 1: Add the roster, summary type, and two functions**

Find `fetchProfile` (lines 388-391):

```ts
export async function fetchProfile() {
  await delay();
  return currentUser;
}
```

Insert directly after its closing `}`:

```ts

export interface AdminUserSummary extends UserProfile {
  postCount: number;
  reportsAgainstCount: number;
  isSuspended: boolean;
}

// Synthetic roster for the admin panel — this mock layer only ever tracked a
// single currentUser, but the named (non-anonymous) post/comment authors
// already seeded above imply other accounts. fetchAllUsersAdmin correlates
// against posts/comments/reports by displayName, since seed content carries
// no real author id (see targetAuthorDisplayName above).
const ADMIN_USER_ROSTER: { id: string; displayName: string; city: string }[] = [
  { id: currentUser.id, displayName: currentUser.displayName, city: currentUser.city },
  { id: "u-2", displayName: "Divya R.", city: "Chennai" },
  { id: "u-3", displayName: "Sneha R.", city: "Chennai" },
  { id: "u-4", displayName: "Meena K.", city: "Chennai" },
  { id: "u-5", displayName: "Anjali T.", city: "Chennai" },
];

const suspendedUserIds = new Set<string>();

export async function fetchAllUsersAdmin(): Promise<AdminUserSummary[]> {
  await delay();
  return ADMIN_USER_ROSTER.map((u) => ({
    id: u.id,
    displayName: u.displayName,
    city: u.city,
    pgsLivedAt: u.id === currentUser.id ? currentUser.pgsLivedAt : [],
    savedPgIds: u.id === currentUser.id ? currentUser.savedPgIds : [],
    joinedPgIds: u.id === currentUser.id ? currentUser.joinedPgIds : [],
    accountCreatedAt: u.id === currentUser.id ? currentUser.accountCreatedAt : hoursAgo(24 * 60),
    postCount: posts.filter((p) => !p.author.isAnonymous && p.author.displayName === u.displayName).length,
    reportsAgainstCount: reports.filter((r) => targetAuthorDisplayName(r) === u.displayName).length,
    isSuspended: suspendedUserIds.has(u.id),
  }));
}

export async function setUserSuspended(userId: string, suspended: boolean): Promise<AdminUserSummary> {
  await delay(150);
  if (suspended) suspendedUserIds.add(userId);
  else suspendedUserIds.delete(userId);
  const users = await fetchAllUsersAdmin();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");
  return user;
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/mock-data.ts
git commit -m "feat(admin): add synthesized user roster with suspend/reinstate"
```

---

### Task 5: Admin allowlist (`src/lib/admin.ts`)

**Files:**
- Create: `apps/web/src/lib/admin.ts`

**Interfaces:**
- Produces: `ADMIN_USER_IDS: string[]`, `isAdmin(userId: string | undefined): boolean` — consumed by Task 6 (`AdminGuard`) and Task 12 (Profile page link).

- [ ] **Step 1: Create the file**

```ts
// Hardcoded allowlist standing in for a real admin role. There is no login
// system in this app yet — currentUser (mock-data.ts) is the only "session"
// that exists — so this is a UI-only gate, not a security boundary. It
// documents the mechanism a real is_admin flag + Supabase Auth check should
// replace once auth exists (see README.md and
// docs/superpowers/specs/2026-09-10-admin-panel-design.md).
export const ADMIN_USER_IDS: string[] = ["u-me"];

export function isAdmin(userId: string | undefined): boolean {
  return !!userId && ADMIN_USER_IDS.includes(userId);
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/admin.ts
git commit -m "feat(admin): add hardcoded admin allowlist"
```

---

### Task 6: `AdminGuard` component

**Files:**
- Create: `apps/web/src/components/admin/admin-guard.tsx`

**Interfaces:**
- Consumes: `fetchProfile` from `@/lib/mock-data`, `isAdmin` from `@/lib/admin` (Task 5), `Skeleton` from `@/components/ui/skeleton`.
- Produces: `AdminGuard({ children }: { children: React.ReactNode })` — consumed by Task 8 (`app/admin/layout.tsx`).

- [ ] **Step 1: Create the file**

```tsx
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "@/lib/mock-data";
import { isAdmin } from "@/lib/admin";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Skeleton className="h-32 w-full max-w-sm rounded-2xl" />
      </div>
    );
  }

  if (!isAdmin(profile?.id)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <h1 className="font-heading text-lg font-bold text-heading">Admins only</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This account doesn&apos;t have access to the admin panel.
        </p>
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          Back to SheStays
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors. (Full behavioral verification happens in Task 8, once there's a route to load it on.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/admin-guard.tsx
git commit -m "feat(admin): add AdminGuard access gate"
```

---

### Task 7: `AdminShell` + `AdminStatCard`

**Files:**
- Create: `apps/web/src/components/admin/admin-shell.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`.
- Produces: `AdminShell({ children }: { children: React.ReactNode })`, `AdminStatCard({ label, value }: { label: string; value: string | number })` — `AdminShell` consumed by Task 8 (`app/admin/layout.tsx`); `AdminStatCard` consumed by Tasks 9-11 (the three admin pages).

- [ ] **Step 1: Create the file**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ADMIN_TABS = [
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/pgs", label: "PGs" },
  { href: "/admin/users", label: "Users" },
];

// Scoped dark surface: the "dark" class here activates the existing .dark
// theme tokens from globals.css (pink primary stays pink — see the .dark
// block's --primary mapping) only inside this subtree. The rest of the app
// stays on the light theme.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Link href="/admin/reports" className="font-heading text-lg font-bold text-primary">
            SheStays Admin
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Exit to app
          </Link>
        </div>

        <nav className="flex w-fit gap-1 rounded-full border border-border bg-card p-1">
          {ADMIN_TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                pathname === tab.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}

export function AdminStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-heading">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/admin-shell.tsx
git commit -m "feat(admin): add AdminShell chrome and AdminStatCard"
```

---

### Task 8: Admin layout + index redirect

**Files:**
- Create: `apps/web/src/app/admin/layout.tsx`
- Create: `apps/web/src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `AdminGuard` (Task 6), `AdminShell` (Task 7).

- [ ] **Step 1: Create the layout**

```tsx
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
```

- [ ] **Step 2: Create the index redirect**

```tsx
import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  redirect("/admin/reports");
}
```

- [ ] **Step 3: Verify**

Run: `cd apps/web && npx tsc --noEmit` — expect no new errors.

Then, using the Browser tool against the running dev server (`preview_start` with the `web` launch config if not already running):
1. Navigate to `http://localhost:3000/admin`.
2. Expected: redirected to `/admin/reports`, which 404s for now (page doesn't exist until Task 9) — that 404 is expected at this point. What you're confirming here is that the dark `AdminShell` chrome and pill nav render around Next's 404 boundary, and that the mock `currentUser` (id `u-me`, on the allowlist) is NOT shown the "Admins only" message.
3. Temporarily edit `apps/web/src/lib/admin.ts`'s `ADMIN_USER_IDS` to `[]`, reload `/admin` — expected: "Admins only" message with a "Back to SheStays" link. Revert the edit back to `["u-me"]` afterward.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/admin/layout.tsx apps/web/src/app/admin/page.tsx
git commit -m "feat(admin): add /admin layout with guard and index redirect"
```

---

### Task 9: Reports queue page

**Files:**
- Create: `apps/web/src/app/admin/reports/page.tsx`

**Interfaces:**
- Consumes: `fetchReports`, `resolveReport` (Task 2), `AdminStatCard` (Task 7), `relativeTime` from `@/lib/format`, `cn` from `@/lib/utils`, `Button` from `@/components/ui/button`, `Report` type from `@/types/domain`.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminStatCard } from "@/components/admin/admin-shell";
import { fetchReports, resolveReport } from "@/lib/mock-data";
import type { Report } from "@/types/domain";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: (Report["status"] | "all")[] = ["all", "pending", "actioned", "dismissed"];

export default function AdminReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsView />
    </Suspense>
  );
}

function ReportsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("selected");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({ queryKey: ["admin-reports"], queryFn: fetchReports });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "actioned" | "dismissed" }) => resolveReport(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData<Report[]>(["admin-reports"], (old) =>
        old?.map((r) => (r.id === updated.id ? updated : r))
      );
      toast.success(`Report marked ${updated.status}`);
    },
    onError: () => toast.error("Couldn't update the report — try again."),
  });

  const filtered = (reports ?? []).filter((r) => statusFilter === "all" || r.status === statusFilter);
  const selected = reports?.find((r) => r.id === selectedId) ?? null;

  const select = (id: string) => router.push(`/admin/reports?selected=${id}`);

  const pendingCount = reports?.filter((r) => r.status === "pending").length ?? 0;
  const actionedCount = reports?.filter((r) => r.status === "actioned").length ?? 0;
  const dismissedCount = reports?.filter((r) => r.status === "dismissed").length ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AdminStatCard label="Pending reports" value={pendingCount} />
        <AdminStatCard label="Actioned" value={actionedCount} />
        <AdminStatCard label="Dismissed" value={dismissedCount} />
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium capitalize",
              statusFilter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No reports match this filter.
            </p>
          )}
          {filtered.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => select(report.id)}
              className={cn(
                "block w-full rounded-xl border p-3 text-left",
                selected?.id === report.id
                  ? "border-primary bg-card"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium capitalize text-heading">
                  {report.reason.replace("_", " ")}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                    report.status === "pending" && "bg-warning/15 text-warning",
                    report.status === "actioned" && "bg-success/15 text-success",
                    report.status === "dismissed" && "bg-muted text-muted-foreground"
                  )}
                >
                  {report.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {report.targetType} · {relativeTime(report.createdAt)}
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a report to see detail.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <h2 className="font-heading text-base font-semibold capitalize text-heading">
                  {selected.reason.replace("_", " ")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Reported {relativeTime(selected.createdAt)} · targets a {selected.targetType} (
                  {selected.targetId})
                </p>
              </div>
              {selected.detail && (
                <p className="rounded-lg bg-secondary/40 p-3 text-sm text-body">{selected.detail}</p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  disabled={selected.status === "actioned" || resolveMutation.isPending}
                  onClick={() => resolveMutation.mutate({ id: selected.id, status: "actioned" })}
                >
                  Mark actioned
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={selected.status === "dismissed" || resolveMutation.isPending}
                  onClick={() => resolveMutation.mutate({ id: selected.id, status: "dismissed" })}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit` — expect no new errors.

Then, using the Browser tool:
1. Navigate to `http://localhost:3000/admin/reports`. Expected: dark shell, "Reports" tab active, three stat cards (Pending reports: 1, Actioned: 1, Dismissed: 0), and two rows in the list (one "Harassment" pending, one "Other" actioned).
2. Click the pending report row. Expected: detail panel on the right shows its reason, detail text, and "Mark actioned"/"Dismiss" buttons; the URL updates to `/admin/reports?selected=report-1`.
3. Click "Mark actioned". Expected: a toast "Report marked actioned", the row's badge updates to green "actioned", the "Pending reports" stat drops to 0 and "Actioned" rises to 2, without a page reload.
4. Click the "pending" filter pill. Expected: list is now empty with the "No reports match this filter" placeholder (since both reports are now actioned/dismissed).
5. Go to any post's card in the main app (e.g. `http://localhost:3000`), open its report modal via the "···" menu → Report, submit a report. Return to `/admin/reports` (or refresh) — expected: a new pending report appears at the top of the list.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/admin/reports/page.tsx
git commit -m "feat(admin): add reports queue page"
```

---

### Task 10: PG management page

**Files:**
- Create: `apps/web/src/app/admin/pgs/page.tsx`

**Interfaces:**
- Consumes: `fetchAllPgsAdmin`, `setPgVisibility` (Task 3), `AdminStatCard` (Task 7), `Button` from `@/components/ui/button`, `Pg` type from `@/types/domain`, `cn` from `@/lib/utils`.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminStatCard } from "@/components/admin/admin-shell";
import { fetchAllPgsAdmin, setPgVisibility } from "@/lib/mock-data";
import type { Pg } from "@/types/domain";
import { cn } from "@/lib/utils";

export default function AdminPgsPage() {
  return (
    <Suspense fallback={null}>
      <PgsView />
    </Suspense>
  );
}

function PgsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("selected");
  const queryClient = useQueryClient();

  const { data: pgsList, isLoading } = useQuery({ queryKey: ["admin-pgs"], queryFn: fetchAllPgsAdmin });

  const visibilityMutation = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => setPgVisibility(id, visible),
    onSuccess: (updated) => {
      queryClient.setQueryData<Pg[]>(["admin-pgs"], (old) =>
        old?.map((p) => (p.id === updated.id ? updated : p))
      );
      toast.success(updated.isPubliclyVisible ? "PG is now public" : "PG hidden from public listing");
    },
    onError: () => toast.error("Couldn't update visibility — try again."),
  });

  const selected = pgsList?.find((p) => p.id === selectedId) ?? null;
  const select = (id: string) => router.push(`/admin/pgs?selected=${id}`);

  const belowThreshold = pgsList?.filter((p) => !p.isPubliclyVisible).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AdminStatCard label="Total PGs" value={pgsList?.length ?? 0} />
        <AdminStatCard label="Below visibility threshold" value={belowThreshold} />
        <AdminStatCard label="Public" value={(pgsList?.length ?? 0) - belowThreshold} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {pgsList?.map((pg) => (
            <button
              key={pg.id}
              type="button"
              onClick={() => select(pg.id)}
              className={cn(
                "block w-full rounded-xl border p-3 text-left",
                selected?.id === pg.id ? "border-primary bg-card" : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-heading">{pg.name}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    pg.isPubliclyVisible ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  )}
                >
                  {pg.isPubliclyVisible ? "Public" : "Hidden"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {pg.area} · {pg.memberCount} members · {pg.reviewCount} reviews
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a PG to see detail.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <h2 className="font-heading text-base font-semibold text-heading">{selected.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {selected.area}
                  {selected.address ? ` · ${selected.address}` : ""}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg bg-secondary/40 p-2 text-center">
                  <p className="font-heading text-lg font-bold text-heading">{selected.memberCount}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div className="rounded-lg bg-secondary/40 p-2 text-center">
                  <p className="font-heading text-lg font-bold text-heading">{selected.reviewCount}</p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
                <div className="rounded-lg bg-secondary/40 p-2 text-center">
                  <p className="font-heading text-lg font-bold text-heading">
                    {selected.aggregateRating?.toFixed(1) ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
              <Button
                size="sm"
                variant={selected.isPubliclyVisible ? "outline" : "default"}
                disabled={visibilityMutation.isPending}
                onClick={() =>
                  visibilityMutation.mutate({ id: selected.id, visible: !selected.isPubliclyVisible })
                }
              >
                {selected.isPubliclyVisible ? "Hide from public listing" : "Make public"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit` — expect no new errors.

Then, using the Browser tool:
1. Navigate to `http://localhost:3000/admin/pgs`. Expected: 5 PGs listed, stat cards show "Total PGs: 5", "Below visibility threshold: 1" (pg-4, Velachery Girls Hostel, is seeded below the §11 threshold), "Public: 4".
2. Click "Velachery Girls Hostel" (the Hidden one). Expected: detail panel shows its stats and a "Make public" button.
3. Click "Make public". Expected: toast "PG is now public", its badge flips to green "Public", stat cards update to "Below visibility threshold: 0" / "Public: 5" without reload.
4. Navigate to `http://localhost:3000` (home feed) — confirm this PG does not yet appear there (the toggle only affects the mock's `isPubliclyVisible` field consumed by `fetchDiscoverFeed`/`fetchAllPgsAdmin`; a full re-render check on the discover feed is a bonus sanity check, not required to pass this task).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/admin/pgs/page.tsx
git commit -m "feat(admin): add PG management page with visibility toggle"
```

---

### Task 11: User management page

**Files:**
- Create: `apps/web/src/app/admin/users/page.tsx`

**Interfaces:**
- Consumes: `fetchAllUsersAdmin`, `setUserSuspended`, `AdminUserSummary` (Task 4), `AdminStatCard` (Task 7), `Button` from `@/components/ui/button`, `cn` from `@/lib/utils`.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminStatCard } from "@/components/admin/admin-shell";
import { fetchAllUsersAdmin, setUserSuspended, type AdminUserSummary } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersView />
    </Suspense>
  );
}

function UsersView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("selected");
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchAllUsersAdmin });

  const suspendMutation = useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) => setUserSuspended(id, suspended),
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminUserSummary[]>(["admin-users"], (old) =>
        old?.map((u) => (u.id === updated.id ? updated : u))
      );
      toast.success(updated.isSuspended ? "User suspended" : "User reinstated");
    },
    onError: () => toast.error("Couldn't update the user — try again."),
  });

  const selected = users?.find((u) => u.id === selectedId) ?? null;
  const select = (id: string) => router.push(`/admin/users?selected=${id}`);

  const suspendedCount = users?.filter((u) => u.isSuspended).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AdminStatCard label="Total users" value={users?.length ?? 0} />
        <AdminStatCard label="Suspended" value={suspendedCount} />
        <AdminStatCard
          label="Reports filed against users"
          value={users?.reduce((sum, u) => sum + u.reportsAgainstCount, 0) ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {users?.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => select(user.id)}
              className={cn(
                "block w-full rounded-xl border p-3 text-left",
                selected?.id === user.id
                  ? "border-primary bg-card"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-heading">{user.displayName}</span>
                {user.isSuspended && (
                  <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-medium text-danger">
                    Suspended
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {user.postCount} posts · {user.reportsAgainstCount} reports against
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a user to see detail.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <h2 className="font-heading text-base font-semibold text-heading">{selected.displayName}</h2>
                <p className="text-xs text-muted-foreground">{selected.city}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-secondary/40 p-2 text-center">
                  <p className="font-heading text-lg font-bold text-heading">{selected.postCount}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div className="rounded-lg bg-secondary/40 p-2 text-center">
                  <p className="font-heading text-lg font-bold text-heading">{selected.reportsAgainstCount}</p>
                  <p className="text-xs text-muted-foreground">Reports against</p>
                </div>
              </div>
              <Button
                size="sm"
                variant={selected.isSuspended ? "outline" : "destructive"}
                disabled={suspendMutation.isPending}
                onClick={() => suspendMutation.mutate({ id: selected.id, suspended: !selected.isSuspended })}
              >
                {selected.isSuspended ? "Reinstate user" : "Suspend user"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit` — expect no new errors.

Then, using the Browser tool:
1. Navigate to `http://localhost:3000/admin/users`. Expected: 5 users listed (Priya S., Divya R., Sneha R., Meena K., Anjali T.), stat cards show "Total users: 5", "Suspended: 0", and "Reports filed against users" reflecting how many of the two seeded reports (Task 2) target a non-anonymous author (report-2 targets comment `c-2` by Divya R., so this should read 1 — report-1 targets an anonymous post and correlates to no user).
2. Click "Divya R.". Expected: detail panel shows her post/report counts and a "Suspend user" button (destructive/red style).
3. Click "Suspend user". Expected: toast "User suspended", her row shows a red "Suspended" badge, "Suspended" stat becomes 1, button now reads "Reinstate user" in outline style.
4. Click "Reinstate user". Expected: badge disappears, "Suspended" stat returns to 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/admin/users/page.tsx
git commit -m "feat(admin): add user management page with suspend/reinstate"
```

---

### Task 12: Admin entry point on Profile page

**Files:**
- Modify: `apps/web/src/app/profile/page.tsx`

**Interfaces:**
- Consumes: `isAdmin` from `@/lib/admin` (Task 5).

- [ ] **Step 1: Add the import and the link**

Add to the import block at the top of `apps/web/src/app/profile/page.tsx`:

```ts
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
```

Find this block (the header card's outer flex row):

```tsx
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="size-14 shrink-0 sm:size-16">
```

Change the wrapping structure so the avatar/name group sits inside a `justify-between` row with the admin link as a sibling, so it reads:

```tsx
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <Avatar className="size-14 shrink-0 sm:size-16">
                  <AvatarFallback className="text-base font-semibold text-primary-hover bg-primary-soft sm:text-lg">
                    {profile.displayName
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h1 className="truncate font-heading text-base font-bold text-heading sm:text-lg">
                    {profile.displayName}
                  </h1>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    {profile.city}
                  </p>
                </div>
              </div>
              {isAdmin(profile.id) && (
                <Link href="/admin" className="shrink-0 text-xs font-medium text-primary hover:underline">
                  Admin panel
                </Link>
              )}
            </div>
```

(This replaces the existing `<div className="flex items-center gap-3 sm:gap-4">...</div>` block one level in — the avatar/name/city markup itself is unchanged, only re-indented one level under the new wrapping `justify-between` row, with the admin link added as a sibling.)

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit` — expect no new errors.

Then, using the Browser tool:
1. Navigate to `http://localhost:3000/profile`. Expected: a small "Admin panel" link now appears top-right of the profile card (the mock `currentUser.id` is `u-me`, which is on the allowlist).
2. Click it. Expected: navigates to `/admin` → redirects to `/admin/reports`, dark shell renders.
3. Temporarily set `ADMIN_USER_IDS` to `[]` in `apps/web/src/lib/admin.ts`, reload `/profile` — expected: the "Admin panel" link is gone. Revert the edit back to `["u-me"]` afterward.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/profile/page.tsx
git commit -m "feat(admin): add admin panel entry point on Profile page"
```
