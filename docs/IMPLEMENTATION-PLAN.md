# Implementation Plan — SheStays Community v1 Production Readiness

**Branch:** `master`  
**Created:** 2026-09-17  
**Decisions Locked:** D1=A (Email OTP), D2=B (Render), D3=A (Postgres FTS), D4=A (Next.js Admin), D5=B (Incremental Swap)

---

## Executive Summary

| Dimension | Status |
|-----------|--------|
| Frontend (Next.js) | Feature-complete MVP (mock data) |
| Backend (FastAPI) | Skeleton — 0 endpoints implemented |
| Database (Supabase) | Schema + RLS + hardening applied |
| Authentication | None implemented |
| Production Readiness | **Not ready** — critical path: auth + API integration |

**Total Estimated Effort:** ~26 days sequential / ~18 days with parallelization

---

## Decisions

| ID | Decision | Choice | Rationale |
|----|----------|--------|-----------|
| D1 | Auth | Email OTP only (~1 day), phone deferred to v1.1 | Faster to ship; Supabase supports both |
| D2 | Backend Hosting | Render (~$7/mo, always-on) | Avoids Vercel Python cold starts |
| D3 | Search | Postgres `tsvector` + GIN index | Free, good enough for 10k PGs |
| D4 | Moderation Admin | Build in Next.js (~3 days, unified stack) | Consistent stack; no extra tooling |
| D5 | Mock → Live Swap | Incremental with feature flag (~5 days, safer) | Reduces risk; TypeScript catches mismatches |

---

## Phase Breakdown

### Phase 0: Security Hygiene (Day 1) — **BLOCKER**

| Task | Description |
|------|-------------|
| 0.1 | Rotate Supabase DB password in dashboard |
| 0.2 | Update `apps/api/.env` with new password |
| 0.3 | Remove `apps/api/.env` from git history (BFG/filter-branch) |
| 0.4 | Verify `.env.local` in `.gitignore` for both apps |

**Exit Criteria:** No secrets in git history; DB password rotated.

---

### Phase 1: Auth Foundation (Days 2-3)

| Task | Description | Type |
|------|-------------|------|
| 1.1 | Enable Email OTP provider in Supabase dashboard | Config |
| 1.2 | Configure email template (Supabase built-in) | Config |
| 1.3 | Create `AuthProvider` context with session state | AFK |
| 1.4 | Build `/auth/signin` page (email input → OTP send) | AFK |
| 1.5 | Build `/auth/verify` page (OTP input → verify) | AFK |
| 1.6 | Add women-attestation checkbox + `women_attested_at` | AFK |
| 1.7 | Create `useAuth` hook for components | AFK |
| 1.8 | Add protected route wrapper (redirect to signin) | AFK |
| 1.9 | Wire `proxy.ts` to refresh session on every request | AFK |
| 1.10 | Create Supabase auth trigger → insert into `users` table | AFK |
| 1.11 | Apply trigger to Supabase project | Config |

**Exit Criteria:** User can sign in with email OTP; session persists; `users` row created; women-attestation recorded.

---

### Phase 2: Backend API — Core Infrastructure (Days 4-6)

| Task | Description | Type |
|------|-------------|------|
| 2.1 | Pydantic settings management (`pydantic-settings`) | AFK |
| 2.2 | Supabase service client dependency | AFK |
| 2.3 | JWT auth middleware (validate Supabase access token) | AFK |
| 2.4 | Global exception handler + error envelopes | AFK |
| 2.5 | Rate limiting middleware (per PRD §5.5) | AFK |
| 2.6 | Structured JSON logging + request IDs | AFK |
| 2.7 | CORS config for production domain | AFK |
| 2.8 | Health check with DB connectivity | AFK |
| 2.9 | Pydantic models for all request/response schemas | AFK |
| 2.10 | Database indexes for `pg_is_visible()` performance | AFK |
| 2.11 | Apply migration to Supabase | Config |

**Exit Criteria:** FastAPI runs locally; auth middleware validates tokens; rate limiting works; error envelopes standardized; indexes applied.

---

### Phase 3: Backend API — Endpoint Implementation (Days 7-11)

| Endpoint Group | Endpoints | Type |
|----------------|-----------|------|
| PG | `GET /pgs`, `GET /pgs/search`, `GET /pgs/{id}`, `POST /pgs` | AFK |
| Posts | `GET /pgs/{id}/posts`, `POST /pgs/{id}/posts`, `GET /posts/{id}` | AFK |
| Comments | `GET /posts/{id}/comments`, `POST /posts/{id}/comments` | AFK |
| Votes | `POST /posts/{id}/vote`, `POST /comments/{id}/vote`, `POST /posts/{id}/poll/vote` | AFK |
| Reports | `POST /reports` | AFK |
| Notifications | `GET /notifications`, `PATCH /notifications/{id}/read` | AFK |
| Background Jobs | Notification dispatch on events | AFK |

**Exit Criteria:** All endpoints return 200/201 with correct schemas; rate limiting enforced; notifications created on events.

---

### Phase 4: Frontend → Live API Swap (Days 12-16)

| Module | Mock Functions | API Endpoints | Type |
|--------|----------------|---------------|------|
| Auth/Profile | `fetchProfile` | `GET /users/me` | AFK |
| PG Search/Discovery | `searchPgs`, `fetchDiscoverFeed`, `fetchNearbyPgs`, `fetchSuggestedPgs` | `GET /pgs/search`, `GET /pgs` | AFK |
| PG Place Page | `fetchPg`, `fetchPostsForPg`, `fetchPgStats` | `GET /pgs/{id}`, `GET /pgs/{id}/posts` | AFK |
| Post Detail | `fetchPost`, `fetchCommentsForPost` | `GET /posts/{id}`, `GET /posts/{id}/comments` | AFK |
| Compose | `createPost`, `createPg` | `POST /pgs/{id}/posts`, `POST /pgs` | AFK |
| Comments | `createComment` | `POST /posts/{id}/comments` | AFK |
| Votes | `votePost`, `votePollOption` | `POST /posts/{id}/vote`, `POST /posts/{id}/poll/vote` | AFK |
| Save/Report | `toggleSavePost`, `reportContent` | `POST /posts/{id}/save`, `POST /reports` | AFK |
| Notifications | `fetchNotifications` | `GET /notifications` | AFK |
| Membership | `joinPg`, `fetchJoinedPgs` | `POST /pgs/{id}/join`, `GET /users/me/pgs` | AFK |

**Exit Criteria:** `USE_LIVE_API=true` works end-to-end; all features functional; no mock imports in production build.

---

### Phase 5: Trust & Safety (Days 17-20)

| Task | Description | Type |
|------|-------------|------|
| 5.1 | Create `/admin` route (protected, staff-only) | AFK |
| 5.2 | Reports queue table (filter by status, reason) | AFK |
| 5.3 | Report detail modal (view content, take action) | AFK |
| 5.4 | Actions: hide post, remove post, ban user | AFK |
| 5.5 | User management (view, ban, unban) | AFK |
| 5.6 | Moderation logs / audit trail | AFK |
| 5.7 | Notification dispatch service (generic templates per §5.4.1) | AFK |
| 5.8 | Supabase Edge Function for push (OneSignal free tier) | AFK |
| 5.9 | Profanity filter on post/comment create | AFK |
| 5.10 | PII detection (phone, email, address regex) | AFK |
| 5.11 | Auto-flag for review (don't block — flag) | AFK |
| 5.12 | Server-side rate limiting enforcement (PRD §5.5) | AFK |

**Exit Criteria:** Admin can review/act on reports; notifications dispatched generically; rate limits enforced server-side.

---

### Phase 6: Search & Performance (Days 21-22)

| Task | Description | Type |
|------|-------------|------|
| 6.1 | Add `tsvector` column to `pgs` + `posts` | AFK |
| 6.2 | Create GIN indexes on `tsvector` | AFK |
| 6.3 | Trigger to update `tsvector` on insert/update | AFK |
| 6.4 | Implement FTS in `GET /pgs/search` | AFK |
| 6.5 | Cursor-based pagination for all list endpoints | AFK |
| 6.6 | Load test with k6 (100 concurrent users) | AFK |

---

### Phase 7: Production Hardening (Days 23-25)

| Task | Description | Type |
|----------|-------------|------|
| 7.1 | Next.js CSP (script-src, style-src, img-src, connect-src) | AFK |
| 7.2 | FastAPI security headers middleware | AFK |
| 7.3 | HSTS, X-Frame-Options, Referrer-Policy | AFK |
| 7.4 | GitHub Actions: lint, typecheck, test (frontend) | AFK |
| 7.5 | GitHub Actions: lint, test (backend) | AFK |
| 7.6 | Deploy frontend to Vercel (preview + prod) | Config |
| 7.7 | Deploy backend to Render (preview + prod) | Config |
| 7.8 | Environment variable management (secrets) | Config |
| 7.9 | Sentry integration (frontend + backend) | AFK |
| 7.10 | Uptime monitoring | Config |
| 7.11 | Create staging environment | Config |

---

### Phase 8: Legal & Launch (Day 26)

| Task | Description | Owner |
|------|-------------|-------|
| 8.1 | Legal review of anonymous-review liability (PRD §11) | You + Legal |
| 8.2 | Production deploy | You |

---

## Dependency Graph

```
Phase 0 (Security)
    │
    ▼
Phase 1 (Auth) ◄──────────────────────┐
    │                                  │
    ▼                                  │
Phase 2 (Backend Infra) ───────────────┤
    │                                  │
    ▼                                  │
Phase 3 (Backend Endpoints) ───────────┤
    │                                  │
    ▼                                  │
Phase 4 (Frontend Swap) ────────────────┘
    │
    ├──────────────────┐
    ▼                  ▼
Phase 5a          Phase 5b
(Admin UI)      (Notifications + Filter)
    │                  │
    └────────┬─────────┘
             ▼
        Phase 6 (Search/Perf)
             │
             ▼
        Phase 7 (Hardening)
             │
             ▼
        Phase 8 (Legal/Launch)
```

**Critical Path:** 0 → 1 → 2 → 3 → 4 → 5a/5b → 6 → 7 → 8 = **~26 days sequential**  
**With Parallelization:** ~18 days (Phase 5a || 5b; Phase 2.3 || 2.1-2.2)

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Supabase Auth email delivery issues | Medium | High | Test thoroughly in staging |
| FastAPI on Render cold starts | Low | Medium | Use paid tier ($7/mo) |
| Mock→live type mismatches | High | Medium | Incremental swap with feature flag |
| `pg_is_visible()` performance at scale | Low | High | Indexes added in Phase 2.3 |
| Legal blocks anonymous reviews | Low | Critical | Early legal review; fallback plan |
| Disk space (C: drive) | High | High | Free up space before Phase 2 |

---

## Test Strategy

| Layer | Framework | Scope |
|-------|-----------|-------|
| Frontend Unit | Vitest | Components, hooks, utils |
| Frontend E2E | Playwright | Critical user flows (auth, post, vote) |
| Backend Unit | pytest | Schemas, middleware, business logic |
| Backend Integration | pytest + testcontainers | API endpoints with real Supabase |
| Load | k6 | 100 concurrent users, 5 min duration |

---

## Free Tier Services Used

| Service | Purpose | Free Tier Limits |
|---------|---------|------------------|
| Supabase | Auth, DB, Storage, Realtime | 500MB DB, 1GB bandwidth, 50k MAU |
| Render | Backend hosting | 750 hrs/mo free (paid $7 for always-on) |
| Vercel | Frontend hosting | Unlimited personal projects |
| OneSignal | Push notifications | 10k subscribers free |
| GitHub Actions | CI/CD | 2000 min/mo free |
| Sentry | Error tracking | 5k errors/mo free |

---

## Next Steps

1. ✅ Approve this plan
2. Create GitHub issues for each vertical slice (using `to-issues` skill)
3. Begin Phase 0 (Security Hygiene) — **you must do this first**
4. Begin Phase 1 (Auth Foundation)