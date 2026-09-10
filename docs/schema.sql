-- SheStays Community — Postgres schema (Supabase)
-- Mirrors docs/TECH-STACK.md §3 and the decisions in docs/PRD.md.
-- Run this against a Supabase project once one is connected (see docs/TECH-STACK.md §4/§8
-- and the README for what credentials the app needs).

create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  city text not null,
  avatar_url text,
  -- PRD §5.4: v1 women-only gate is self-attestation + phone OTP, not identity verification.
  phone_verified_at timestamptz,
  women_attested_at timestamptz,
  created_at timestamptz not null default now()
);

create table pgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null check (area in (
    'OMR-Sholinganallur', 'Thoraipakkam', 'Nungambakkam', 'Velachery', 'Anna Nagar'
  )),
  address text,
  cover_image_url text,
  founding_user_id uuid not null references users(id),
  created_at timestamptz not null default now()
);

create table pg_memberships (
  pg_id uuid not null references pgs(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (pg_id, user_id)
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  pg_id uuid not null references pgs(id) on delete cascade,
  -- Anonymity model (PRD §5.3 / TECH-STACK §3): author_id is ALWAYS the real user,
  -- never null. is_anonymous is display-layer only — the API must strip author_id
  -- from responses when is_anonymous = true and return a generic tag instead.
  author_id uuid not null references users(id),
  is_anonymous boolean not null default false,
  type text not null check (type in ('review', 'discussion', 'poll')),
  title text not null,
  body text not null,
  residency_claim text check (residency_claim in ('stayed_here', 'currently_here')),
  rating_tags jsonb, -- e.g. {"Safety": 5, "Food": 3}
  overall_rating numeric(2,1),
  poll_options jsonb, -- [{id, label, voteCount}] — see comment below on why this isn't normalized
  is_removed boolean not null default false,
  created_at timestamptz not null default now()
);
-- poll_options is denormalized JSON rather than a poll_votes table because v1 has no
-- vote-changing UI for polls and volume is low; revisit if poll analytics are needed.

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  parent_comment_id uuid references comments(id) on delete cascade,
  author_id uuid not null references users(id),
  is_anonymous boolean not null default false,
  body text not null,
  is_removed boolean not null default false,
  created_at timestamptz not null default now()
);

create table votes (
  user_id uuid not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  direction smallint not null check (direction in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create table saved_posts (
  user_id uuid not null references users(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users(id),
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  reason text not null check (reason in ('harassment', 'fake_review', 'doxxing', 'spam', 'other')),
  detail text,
  status text not null default 'pending' check (status in ('pending', 'actioned', 'dismissed')),
  resolved_by uuid references users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- PRD §5.4.1: rows carry full context for in-app rendering. Any push/email dispatch
-- built on top of this table must render from a generic template and MUST NOT forward
-- pg_name, post excerpt, or the anonymous flag into the external payload.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('reply', 'upvote', 'mention', 'report_resolved')),
  pg_id uuid not null references pgs(id),
  post_id uuid not null references posts(id),
  was_anonymous boolean not null default false,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index on posts (pg_id, created_at desc);
create index on comments (post_id, parent_comment_id);
create index on notifications (user_id, is_read, created_at desc);
create index on reports (status, created_at);

-- PRD §5.5 rate limiting is enforced server-side at write time (FastAPI middleware /
-- Supabase RLS + a policy function), not encoded as a DB constraint — thresholds
-- (24h/3 posts, <5 lifetime actions/10 per 24h) are product config, not schema.

-- PRD §11 visibility threshold: a PG is publicly listed once it has >=3 distinct
-- posting accounts OR >=5 total reviews. Compute this at query time (or via a
-- materialized view) rather than storing a stale boolean on `pgs`.
