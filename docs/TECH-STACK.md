# Tech Stack Specification — SheStays Community

Design goals: cheap to run at 0–5,000 users, scales to 10,000+ without a rewrite, fast to build with an AI coding agent (Claude Code / Cursor), real-time-ish feed and comments, strong content moderation hooks.

## 1. Frontend
- **Framework**: Next.js 14+ (App Router) + TypeScript — SSR for PG place pages (SEO matters: "PG name + area review" is a real search query), client-side interactivity for feed/voting.
- **Styling**: Tailwind CSS, using the provided design tokens (see DESIGN-SYSTEM.md) mapped to Tailwind theme config.
- **UI components**: shadcn/ui as the base component library (headless, themeable, matches "modern SaaS" look), extended with custom components for post cards, vote buttons, and the anonymous toggle.
- **State/data fetching**: TanStack Query (React Query) for server state (feed, comments, votes) + optimistic updates for upvote/downvote and posting.
- **Responsive strategy**: mobile-first build (matches reference screens), with a distinct desktop layout above the `lg` breakpoint — desktop gets a 3-column layout (nav / feed / PG info+trending sidebar) rather than a stretched mobile view.

## 2. Backend
- **Framework**: FastAPI (Python) — matches your stated preference for a production-grade Python backend, async-friendly for feed/comment endpoints, easy OpenAPI docs for the AI coding agent to work against.
- **Alternative if you want batteries-included admin/moderation tooling out of the box**: Django + DRF (Django admin becomes your moderation queue almost for free — worth considering given how central moderation is to this product).
- **Recommendation**: FastAPI + a lightweight custom admin (see §6) for speed; revisit Django only if the moderation queue outgrows a simple internal tool.

## 3. Database
- **Postgres** via **Supabase** (managed Postgres + auth + storage in one place, generous free tier, matches your existing PG-finder stack decision).
- Core tables: `users`, `pgs` (place pages), `posts`, `comments`, `votes`, `reports`, `pg_memberships`, `notifications`.
- Anonymity model: `posts.author_id` always references the real user (never null) + `posts.is_anonymous boolean`. Display layer hides `author_id` from API responses when `is_anonymous = true` and returns a generic label instead — identity is never sent to the client for anonymous posts, only visible to backend/moderation.
- Notifications (per PRD §5.4.1): `notifications` rows carry full context (PG, post, snippet) for in-app rendering, but any push/email dispatch built on top of them must render from a generic template ("New reply on one of your posts") — the dispatch layer never forwards `pg.name`, post content, or the anonymous label into a push payload or email subject/preview line.

## 4. Auth
- Supabase Auth (email/phone OTP) for account creation.
- Women-only gate: self-attestation checkbox + phone OTP, per PRD §5.4 v1 decision (stronger ID/selfie verification deliberately deferred, not implemented here).
- Session handled via Supabase JWT, validated in FastAPI middleware.

## 5. Real-time / feed updates
- v1: polling via React Query (refetch on interval / on window focus) — simplest, cheapest, good enough at this scale.
- v2 (if engagement demands live updates): Supabase Realtime (Postgres change feed) for live comment counts/new posts without a separate websocket service.

## 6. Moderation tooling
- v1: a simple internal admin route (protected, staff-only) built directly in Next.js showing a reports queue — pulls from the `reports` table, lets staff hide/remove content and ban accounts.
- Automated first pass: a basic profanity/PII regex filter + optional call to a hosted moderation API (e.g. OpenAI moderation endpoint) on post/comment creation to auto-flag before it ever goes public.

## 7. File/media storage
- Supabase Storage (S3-compatible) for any images attached to posts (e.g. PG photos in a review). Keep media optional in v1 — text-first product.

## 8. Hosting & infra
- **Frontend**: Vercel (matches Next.js natively, generous free/hobby tier, scales to paid seamlessly).
- **Backend (FastAPI)**: Railway or Render to start (cheapest path to a managed always-on Python service); move to AWS (ECS/Fargate or Lightsail) only once traffic/cost justifies it.
- **Database**: Supabase managed Postgres (same instance as auth/storage — one bill, one dashboard).
- **Domain/DNS**: existing SheStays domain, subdomain or path-based routing (e.g. `community.shestays.app` or `/community` inside the main app) depending on whether this ships standalone or merged into the PG-finder product.

## 9. Suggested repo structure
```
/apps
  /web        → Next.js frontend
  /api        → FastAPI backend
/packages
  /ui         → shared shadcn-based component library + design tokens
/docs
  PRD.md
  TECH-STACK.md
  DESIGN-SYSTEM.md
```

## 10. Cost shape (rough, mirrors your earlier PG-finder budgeting)
- 0–5,000 users: Vercel free/hobby + Render/Railway free-to-~$20/mo tier + Supabase free tier ≈ $0–30/month.
- 5,000–10,000 users: Vercel Pro (~$20/mo) + Render/Railway paid instance (~$25–50/mo) + Supabase Pro (~$25/mo) ≈ $70–100/month.
- Biggest future cost driver: moderation API calls if volume of posts grows fast — budget for this before it becomes a surprise.

## 11. Why this fits your workflow
This stack (Next.js/FastAPI/Supabase) matches your existing PG-finder decisions, so the two products can share auth, database, and design tokens if you later merge the community layer into the booking product — no throwaway work.
