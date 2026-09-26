# Staging Environment Setup

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Developer     │────▶│   Staging       │────▶│   Production    │
│   (Local)       │     │   (Vercel/      │     │   (Vercel/      │
│                 │     │    Render)      │     │    Render)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │   Supabase      │
                        │   (Staging      │
                        │    Project)     │
                        └─────────────────┘
```

## Supabase Staging Project

1. Create a new Supabase project: `shestays-staging`
2. Run all migrations (schema.sql, indexes.sql, rls-policies.sql, hardening.sql, fts-migration.sql)
3. Configure Auth:
   - Enable Email OTP provider
   - Set email template
   - Configure redirect URLs for staging domain
4. Create storage buckets (if needed for images)
5. Enable Realtime for tables: notifications, posts, comments

## Vercel Staging Deployment

### Automatic (Preview Deployments)
- Every PR gets a preview deployment
- URL format: `https://shestays-git-<branch>-<org>.vercel.app`
- Uses `NEXT_PUBLIC_VERCEL_ENV=preview`

### Manual Staging Deployment
1. Push to `staging` branch
2. Vercel deploys to: `https://shestays-staging.vercel.app`
3. Uses `NEXT_PUBLIC_VERCEL_ENV=staging`

### Environment Variables (Staging)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
NEXT_PUBLIC_API_URL=https://shestays-api-staging.onrender.com/api/v1
NEXT_PUBLIC_ONESIGNAL_APP_ID=staging-onesignal-id
NEXT_PUBLIC_SENTRY_DSN=staging-sentry-dsn
NEXT_PUBLIC_USE_LIVE_API=true
```

## Render Staging Service

### Create Staging Service
1. In Render dashboard, create new Web Service: `shestays-api-staging`
2. Connect to same repo, but set branch to `staging`
3. Plan: Starter (or Free for testing)
4. Region: Singapore (same as prod)

### Environment Variables (Staging)
```bash
APP_ENV=staging
LOG_LEVEL=DEBUG
DATABASE_URL=postgresql://postgres:xxx@db.staging-project.supabase.co:5432/postgres
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=staging-service-key
SUPABASE_ANON_KEY=staging-anon-key
CORS_ORIGINS=https://shestays-staging.vercel.app,https://shestays-git-*.vercel.app
RATE_LIMIT_REQUESTS=200
RATE_LIMIT_WINDOW=60
ONESIGNAL_APP_ID=staging-onesignal-id
ONESIGNAL_API_KEY=staging-onesignal-key
SENTRY_DSN=staging-sentry-dsn
```

## GitHub Branch Strategy

```
main (production)
  │
  ├── develop (integration)
  │     │
  │     ├── feature/xyz
  │     ├── feature/abc
  │     │
  │     └── (PRs → develop)
  │
  └── staging (pre-production)
        │
        └── (PRs from develop → staging)
```

## Deployment Flow

### Feature Development
1. Create feature branch from `develop`
2. Develop and test locally
3. Open PR to `develop`
4. CI runs (lint, typecheck, test)
5. Preview deployment created
6. Review and merge

### Staging Release
1. Open PR from `develop` → `staging`
2. CI runs full suite
3. Deploy to staging
4. QA testing on staging
5. Approve and merge

### Production Release
1. Open PR from `staging` → `main`
2. CI runs full suite
3. Deploy to production
4. Monitor rollout

## Database Seeding for Staging

Create `scripts/seed-staging.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.STAGING_SUPABASE_URL!,
  process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  // Create test users
  // Create test PGs
  // Create test posts/comments
  // Create test memberships
}

seed().catch(console.error);
```

Run in CI before E2E tests.

## Testing in Staging

### Automated
- E2E tests run against staging after deployment
- Load tests run weekly against staging
- Security scans run on each deploy

### Manual QA Checklist
- [ ] Auth flow (sign in, verify OTP, attestation)
- [ ] PG search and creation
- [ ] Post creation (all types)
- [ ] Comments and voting
- [ ] Notifications
- [ ] Admin panel (reports, users, logs)
- [ ] Anonymous posting
- [ ] Rate limiting
- [ ] Content filtering

## Rollback Procedure

### Frontend (Vercel)
```bash
# Via CLI
vercel rollback shestays-staging [deployment-url]

# Via Dashboard
# Go to Deployments → Click "..." → Promote to Production
```

### Backend (Render)
```bash
# Via Dashboard
# Go to Service → Deploys → Click "..." → Rollback
```

### Database (Supabase)
- Use Point-in-Time Recovery (PITR)
- Or run down migrations manually

## Monitoring Staging

- Separate Sentry project: `shestays-staging`
- Separate UptimeRobot monitors
- Separate OneSignal app
- Lower alert thresholds (more noise acceptable)

## Cost Optimization

- Use Render Free tier for staging (spins down after 15 min inactivity)
- Use Supabase Free tier for staging
- Vercel Preview deployments are free
- Turn off staging services when not in use (weekends)