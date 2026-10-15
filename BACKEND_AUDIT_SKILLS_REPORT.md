# Backend Audit Skills Analysis Report

## Executive Summary

This report analyzes **24 backend audit-related skills** available in the OpenCode/ECC ecosystem, organized into 5 functional categories. The skills cover security auditing, production readiness, database patterns, framework-specific security, infrastructure/deployment, and error handling/diagnosis.

---

## Skill Inventory by Category

### 1. Security & Compliance (5 Skills)

| Skill | Purpose | Key Capabilities | Best For |
|-------|---------|------------------|----------|
| **security-review** | Comprehensive security audit | OWASP Top 10, AuthZ, input validation, SQL injection prevention, XSS/CSRF protection, secrets management, rate limiting | All projects - baseline security |
| **security-bounty-hunter** | Vulnerability discovery for bounties | SSRF, auth bypass, RCE paths, SQLi, command injection, path traversal | High-value targets, FinTech, public APIs |
| **security-scan** | Claude Code config security | AgentShield integration, CLAUDE.md/hooks/MCP scanning, hardcoded secrets, prompt injection | AI-assisted development environments |
| **security-best-practices** | Secure coding patterns | Parameterized queries, CSP headers, env var secrets, server-side authZ, dependency updates | Code reviews, new feature development |
| **authentication-systems** | Auth system implementation | bcrypt/argon2, JWT/cookies, RBAC middleware, login/registration/password reset | Any project needing user auth |

### 2. Backend API & Logic (7 Skills)

| Skill | Purpose | Key Capabilities | Best For |
|-------|---------|------------------|----------|
| **production-audit** | Pre-deployment risk assessment | Ship/block decision, security/data/payment/ops/UX lenses, scoring 0-100 | Every release, pre-launch validation |
| **api-error-handling** | Standardized error responses | Typed error classes, global middleware, sanitized client messages, correlation IDs | All REST/GraphQL APIs |
| **rest-api-development** | RESTful API design | Resource-oriented URLs, HTTP verb mapping, query params, pagination, versioning | New API development |
| **error-handling** | Cross-language error patterns | Typed errors (TS/Python/Go), Result pattern, retry with backoff, user-facing messages | Resilient service development |
| **performance-optimization** | Bottleneck identification & fixes | Core Web Vitals, bundle splitting, DB query optimization, memoization | High-traffic, latency-sensitive systems |
| **debugging-issue-diagnosis** | Root cause analysis | Stack trace analysis, minimal reproduction, strategic logging, regression tests | Production incidents, flaky tests |
| **verification-loop** | Pre-ship quality gates | Comprehensive verification before claiming completion | CI/CD pipelines, release checklists |

### 3. Database & Data Layer (6 Skills)

| Skill | Purpose | Key Capabilities | Best For |
|-------|---------|------------------|----------|
| **postgres-patterns** | PostgreSQL optimization | Index strategies, RLS policies, UPSERT, cursor pagination, pg_stat_statements | Postgres-backed applications |
| **mysql-patterns** | MySQL/MariaDB patterns | Composite indexes, upserts, keyset pagination, JSON columns, connection pooling | MySQL/MariaDB applications |
| **prisma-patterns** | Prisma ORM best practices | N+1 prevention, transaction forms, serverless pooling, soft delete, migration safety | TypeScript/Node.js with Prisma |
| **database-migrations** | Zero-downtime schema changes | Expand-contract pattern, concurrent indexes, data backfills, rollback strategies | Production schema evolution |
| **database-schema-design** | Normalized schema design | 3NF, FK constraints, audit timestamps, strategic denormalization | New projects, schema refactoring |
| **redis-patterns** | Redis data structures & patterns | Cache-aside, rate limiting, distributed locks, Pub/Sub, Streams, eviction policies | Caching, real-time features, queues |

### 4. Framework-Specific Security (4 Skills)

| Skill | Framework | Key Capabilities |
|-------|-----------|------------------|
| **springboot-security** | Spring Boot | JWT filters, @PreAuthorize, Bean Validation, BCrypt, CSRF posture, Vault integration, Bucket4j rate limiting |
| **django-security** | Django | Production settings, custom user model, Argon2, ORM injection prevention, CSP, file upload validation, rate limiting |
| **laravel-security** | Laravel | Sanctum tokens, Gates/Policies, mass assignment protection, HTMLPurifier, signed URLs, encrypted job data |
| **quarkus-security** | Quarkus | JWT/OIDC, RBAC, input validation, CSRF, secrets management, dependency security |

### 5. Infrastructure & Deployment (2 Skills)

| Skill | Purpose | Key Capabilities |
|-------|---------|------------------|
| **kubernetes-patterns** | K8s production manifests | Deployment templates, probes, RBAC, HPA, PDB, Jobs/CronJobs, resource management |
| **deployment-patterns** | CI/CD & deployment strategies | Blue-green, canary, rolling; multi-stage Dockerfiles; health checks; rollback procedures |

---

## Project-Type Applicability Matrix

### SaaS / API-First Products
**All 24 skills apply.** Core stack requires:
- Security: `security-review`, `security-best-practices`, `authentication-systems`
- API: `production-audit`, `api-error-handling`, `rest-api-development`, `error-handling`
- Data: `postgres-patterns`/`mysql-patterns`, `prisma-patterns`, `database-migrations`, `redis-patterns`
- Infra: `kubernetes-patterns`, `deployment-patterns`, `verification-loop`

### E-Commerce / Marketplace
**High Priority (18 skills):**
- Payments: `production-audit` (webhook idempotency), `security-review` (PCI), `api-error-handling`
- Auth: `authentication-systems`, framework-specific (`laravel-security`/`django-security`/`springboot-security`)
- Data: `postgres-patterns`, `database-migrations`, `redis-patterns` (cart/session)
- Performance: `performance-optimization` (checkout flow)

### FinTech / Banking
**Critical (22 skills):**
- Security: `security-bounty-hunter`, `security-scan`, `security-review`, `authentication-systems`
- Compliance: `production-audit` (blockers: auth, payments, migrations)
- Data: All 6 database skills (audit trails, migrations, encryption)
- Infra: `kubernetes-patterns` (HPA, PDB, RBAC), `deployment-patterns` (canary)
- Framework: Relevant framework security skill

### Healthcare / HIPAA
**High Priority (16 skills):**
- Compliance: `security-review`, `production-audit`, `authentication-systems` (RBAC, audit logs)
- Data: `postgres-patterns` (RLS), `database-migrations` (audit), `database-schema-design` (PHI isolation)
- Infra: `kubernetes-patterns` (network policies), `deployment-patterns`
- Debugging: `debugging-issue-diagnosis`, `verification-loop`

### Real-Time / WebSocket / Gaming
**High Priority (14 skills):**
- Performance: `performance-optimization`, `redis-patterns` (Pub/Sub, Streams, leaderboards)
- Data: `redis-patterns`, `database-schema-design` (denormalized reads)
- Infra: `kubernetes-patterns` (HPA, resource limits), `deployment-patterns`
- Error handling: `error-handling` (retry logic), `api-error-handling`

### Serverless / Edge Functions
**High Priority (12 skills):**
- Data: `prisma-patterns` (serverless pooling), `database-migrations` (zero-downtime)
- Deployment: `deployment-patterns` (preview deploys), `verification-loop`
- Performance: `performance-optimization` (cold starts), `api-error-handling`
- Debugging: `debugging-issue-diagnosis`

### ML/AI / Data-Intensive
**High Priority (13 skills):**
- Performance: `performance-optimization`, `redis-patterns` (caching), `kubernetes-patterns` (GPU scheduling)
- Data: `postgres-patterns`/`mysql-patterns` (analytics), `database-schema-design` (wide tables)
- Debugging: `debugging-issue-diagnosis`, `verification-loop`
- Infra: `deployment-patterns` (model serving)

### Legacy Modernization
**High Priority (15 skills):**
- Security: `security-review`, `security-scan`, `security-best-practices`
- Data: `database-schema-design`, `database-migrations` (strangler fig), `postgres-patterns`/`mysql-patterns`
- Debugging: `debugging-issue-diagnosis`, `error-handling`
- Framework: Relevant framework security skill
- Deployment: `deployment-patterns` (strangler deployment)

---

## Skill Interaction Graph

The diagram in `backend-audit-skills.html` visualizes:
- **5 functional regions** (color-coded boundaries)
- **24 skill nodes** organized in a 6×4 grid
- **21 key relationships** showing how skills complement each other
- **5 summary cards** mapping skills to project types

### Key Relationship Patterns

1. **Production Audit as Hub** — `production-audit` connects to 6 other skills as the central release gate
2. **Security Review as Foundation** — `security-review` feeds into framework skills and API error handling
3. **Database Layer Cohesion** — All 6 database skills form a tightly connected subgraph
4. **Framework Skills → Security Review** — Each framework skill provides specifics for the general security review
5. **Infra → Deployment** — `kubernetes-patterns` enables `deployment-patterns` strategies

---

## Recommended Skill Combinations by Use Case

### Pre-Release Checklist (Run in Order)
```
1. security-scan           # Config security
2. security-review         # Code security
3. production-audit        # Release risk (blocks if < 70)
4. verification-loop       # Final quality gate
5. deployment-patterns     # Deploy strategy execution
```

### New Project Setup
```
1. database-schema-design  # Schema foundation
2. database-migrations     # Migration strategy
3. rest-api-development    # API contracts
4. authentication-systems  # Auth foundation
5. security-best-practices # Baseline security
6. framework security      # Framework specifics
```

### Incident Response
```
1. debugging-issue-diagnosis  # Root cause
2. error-handling             # Error pattern fixes
3. performance-optimization   # If perf-related
4. verification-loop          # Regression prevention
```

### Security Hardening Sprint
```
1. security-scan              # Config vulnerabilities
2. security-review            # Code vulnerabilities
3. security-bounty-hunter     # Exploitable paths (if public)
4. authentication-systems     # Auth hardening
5. framework security         # Framework-specific gaps
```

---

## Skill Maturity & Maintenance Notes

| Skill | Maturity | Last Updated | Dependencies |
|-------|----------|--------------|--------------|
| security-review | High | Active | None |
| production-audit | High | Active | security-review |
| security-bounty-hunter | Medium | Active | security-review |
| security-scan | High | Active | ecc-agentshield CLI |
| postgres-patterns | High | Active | Supabase patterns |
| prisma-patterns | High | Active | Prisma version specific |
| springboot-security | High | Active | Spring Boot 3.x |
| django-security | High | Active | Django 4.x/5.x |
| laravel-security | High | Active | Laravel 11.x |
| kubernetes-patterns | High | Active | K8s 1.28+ |
| deployment-patterns | High | Active | Docker, GH Actions |

---

## Visual Diagram

Open **`backend-audit-skills.html`** in a browser to view the interactive architecture diagram with:
- Dark/light theme toggle
- Export to PNG/SVG
- Hover tooltips on components
- 5 summary cards for project-type mapping

---

## Next Steps

1. **Identify your project type** from the matrix above
2. **Select the high-priority skills** for your context
3. **Run the recommended skill combination** for your current phase
4. **Use the visual diagram** to understand skill relationships
5. **Track skill usage** in your CLAUDE.md for team knowledge sharing

---

*Report generated from OpenCode/ECC skill registry analysis. Diagram rendered with Archify.*