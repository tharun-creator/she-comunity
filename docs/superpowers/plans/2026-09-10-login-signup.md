# Login / Signup Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build real `/login` and `/signup` pages backed by Supabase Auth, in a split-screen layout with a supplied hero image, as a self-contained gate that doesn't touch the rest of the app's existing mock-data-driven behavior.

**Architecture:** A `(auth)` route group with a shared split-screen `AuthLayout` (image column + form column), and two client-component pages that call the Supabase browser client's `signInWithPassword`/`signUp` directly — no backend of ours is in this path, so there is no SQL of ours anywhere in this flow. A "Log in" link is added to the existing desktop top nav as the only new entry point; nothing else in the app changes.

**Tech Stack:** Next.js 16 (App Router), React, `@supabase/supabase-js` via the already-scaffolded `apps/web/src/lib/supabase/client.ts`, Tailwind v4 (existing SheStays tokens), shadcn/ui primitives already in the repo (`Button`, `Input`, `Label`).

**Spec:** `docs/superpowers/specs/2026-09-10-login-signup-design.md`

## Global Constraints

- This flow never constructs a SQL string or touches a database directly — every credential operation goes through `supabase.auth.signUp()` / `signInWithPassword()` (the Supabase JS SDK, talking to Supabase's managed GoTrue service over HTTPS). Do not add any raw query, any custom backend endpoint, or any other path for credentials in this plan.
- Login failures always show the single generic message "Invalid email or password." — never differentiate "wrong password" from "no such account" in the UI, to avoid email enumeration.
- Signup requires a checked "I identify as a woman" attestation checkbox before submit is enabled — this is not optional copy, it's the PRD §5.4 trust gate.
- Self-contained gate: do not modify `apps/web/src/lib/mock-data.ts`, `AppShell`, or any existing page's data source in this plan. The only existing file this plan touches is `apps/web/src/components/shestays/top-nav.tsx` (adding one link).
- No test framework is configured in `apps/web` (no `test` script, no runner installed) — verification is `npx tsc --noEmit` plus manual dev-server interaction (via the Browser tool). A live Supabase round-trip cannot be exercised yet (`NEXT_PUBLIC_SUPABASE_ANON_KEY` is still a placeholder in `apps/web/.env.local`) — verification checks the UI, client-side validation, and that the code compiles and calls the SDK with the correct shapes; it does not require an actual successful signup.
- The hero image lives at `apps/web/public/auth-hero.jpg`, supplied by the project owner (confirmed rights). If the file isn't present yet when a task runs, the task still completes (the `<img>` reference is correct code either way) — report DONE_WITH_CONCERNS noting the missing asset rather than blocking.
- Match existing design tokens exactly (`bg-card`, `border-border`, `text-heading`, `text-muted-foreground`, `bg-primary`, `bg-destructive/10`/`text-destructive` for error text, `accent-[var(--ss-primary)]` for the checkbox — same pattern already used in `report-modal.tsx`'s radio inputs).
- Every new/modified `.ts`/`.tsx` file must pass `npx tsc --noEmit` with no new errors before that task's commit.

---

### Task 1: `AuthLayout` (split-screen shell)

**Files:**
- Create: `apps/web/src/app/(auth)/layout.tsx`

**Interfaces:**
- Produces: default-exported `AuthLayout({ children }: { children: React.ReactNode })` — consumed by Task 2 (login page) and Task 3 (signup page), both of which live under this same route group and get this layout automatically via Next.js App Router file conventions (no explicit import needed).

- [ ] **Step 1: Create the file**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element -- static public asset, not an optimizable remote image */}
        <img src="/auth-hero.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="absolute left-8 top-8 font-heading text-xl font-bold text-white">
          SheStays
        </span>
      </div>
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors. (This route group has no page yet, so nothing renders it end-to-end until Task 2 — that's expected at this point; a bare layout with no page is valid but won't be reachable via the dev server until Task 2 lands.)

Check whether the asset exists: `ls apps/web/public/auth-hero.jpg`. If missing, note it in your report as a concern but do not treat it as a blocker (see Global Constraints).

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(auth)/layout.tsx"
git commit -m "feat(auth): add split-screen AuthLayout"
```

---

### Task 2: Login page

**Files:**
- Create: `apps/web/src/app/(auth)/login/page.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/client` (existing, unmodified — returns a Supabase browser client whose `.auth.signInWithPassword({ email, password })` resolves to `{ data: { user, session }, error }`, per `@supabase/auth-js`'s `AuthTokenResponsePassword` type), `Button`/`Input`/`Label` from `@/components/ui/*` (existing).
- Produces: the `/login` route. Links to `/signup` (Task 3).

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (authError) {
      // Generic message regardless of cause — a wrong password and a
      // nonexistent email must look identical, or the form becomes an
      // email-enumeration oracle.
      setError("Invalid email or password.");
      return;
    }

    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-heading">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log in to your SheStays account.</p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {isSubmitting ? "Signing in…" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit` — expect no new errors.

Then, using the Browser tool against the running dev server:
1. Navigate to `http://localhost:3000/login`. Expected: on a wide viewport, the hero image fills the left half (or a broken-image box if the asset isn't placed yet — not a failure per Global Constraints) with "SheStays" overlaid top-left; the form is on the right, centered, max-width constrained. On a narrow/mobile viewport, only the form shows (image column hidden).
2. Confirm the "Log in" button is disabled until both fields have text.
3. Type an email and password, click "Log in". Since the Supabase anon key is still a placeholder, expect a network/auth error — confirm it surfaces as exactly "Invalid email or password." in the red error box (not a raw exception, not a different message), which confirms the catch-all error handling path works even though the real credential check isn't live yet.
4. Click "Create an account" — confirm it navigates to `/signup` (404 is expected until Task 3 lands).

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(auth)/login/page.tsx"
git commit -m "feat(auth): add login page"
```

---

### Task 3: Signup page

**Files:**
- Create: `apps/web/src/app/(auth)/signup/page.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/client` (`.auth.signUp({ email, password, options: { data } })` resolves to `{ data: { user, session }, error }`, per `@supabase/auth-js`'s `AuthResponse` type — `session` is `null` when email confirmation is required, non-null otherwise), `Button`/`Input`/`Label` from `@/components/ui/*`.
- Produces: the `/signup` route. Links to `/login` (Task 2).

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [attested, setAttested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    displayName.trim().length > 0 &&
    city.trim().length > 0 &&
    attested &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, city } },
    });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session) {
      // Email confirmation is off for this project — signUp already
      // returned a live session, so there's nothing to wait on.
      router.push("/");
      return;
    }

    setCheckEmail(true);
  };

  if (checkEmail) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="font-heading text-2xl font-bold text-heading">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to {email}. Click it to finish creating your account.
        </p>
        <Link href="/login" className="inline-block text-sm font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-heading">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Join SheStays to read and share honest PG reviews.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="displayName">Name</Label>
        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="mt-0.5 accent-[var(--ss-primary)]"
          checked={attested}
          onChange={(e) => setAttested(e.target.checked)}
        />
        I identify as a woman.
      </label>

      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit` — expect no new errors.

Then, using the Browser tool:
1. Navigate to `http://localhost:3000/signup`. Expected: same split-screen shell as `/login`; form has Name, City, Email, Password fields, the "I identify as a woman" checkbox, and a "Create account" button.
2. Confirm "Create account" stays disabled until every field has a value AND the checkbox is checked — toggle the checkbox off after filling everything else in to confirm it alone gates submission.
3. Fill in all fields, check the box, click "Create account". Since the anon key is a placeholder, expect a Supabase error — confirm it renders `authError.message` verbatim in the red error box (not the generic login message — signup errors are shown as-is per the spec).
4. Click "Log in" link — confirm it navigates to `/login` and both pages share the same visual shell (image column, form column).

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(auth)/signup/page.tsx"
git commit -m "feat(auth): add signup page"
```

---

### Task 4: "Log in" entry point in top nav

**Files:**
- Modify: `apps/web/src/components/shestays/top-nav.tsx`

**Interfaces:**
- Consumes: nothing new — `Link` from `next/link` is already imported in this file.

- [ ] **Step 1: Add the link**

Find this block near the end of `top-nav.tsx`:

```tsx
      <div className="ml-auto flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/search")}
          aria-label="Search"
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
```

Change it to add a "Log in" link right before the search button, so it reads:

```tsx
      <div className="ml-auto flex items-center gap-4">
        <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Log in
        </Link>
        <button
          type="button"
          onClick={() => router.push("/search")}
          aria-label="Search"
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
```

(Everything else in the file — the Search button, Notifications link, Profile avatar link — is unchanged; this only inserts one new `<Link>` as the first child of that `ml-auto` container.)

- [ ] **Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit` — expect no new errors.

Then, using the Browser tool at a desktop viewport (top nav is `hidden lg:flex`, so it won't show on mobile — that's existing, unrelated behavior):
1. Navigate to `http://localhost:3000`. Expected: a "Log in" text link now appears in the top-right of the nav bar, before the search icon.
2. Click it. Expected: navigates to `/login`.
3. Confirm every other existing top-nav element (Community/Search/Notifications links, profile avatar) still renders and behaves as before — this task only adds one link, nothing else should change.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/shestays/top-nav.tsx
git commit -m "feat(auth): add Log in link to top nav"
```
