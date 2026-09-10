-- SheStays Community — Row Level Security hardening
-- Applies on top of docs/schema.sql. Run once schema.sql has created the base tables.
--
-- Security model:
--   * RLS is enabled on every table; there is no implicit access. Every allowed
--     read/write is an explicit policy below.
--   * `service_role` (used only by the backend, never shipped to the browser) bypasses
--     RLS entirely — that's how the FastAPI backend reads/writes full data after
--     validating the Supabase JWT itself. `anon` and `authenticated` are the only
--     roles a browser-held key can act as.
--   * The anonymity model (PRD §5.3): posts.author_id / comments.author_id must never
--     reach a client when is_anonymous = true. RLS alone can filter ROWS, not redact a
--     COLUMN conditionally per row, so posts/comments/users are locked down to
--     `service_role` only and exposed to anon/authenticated exclusively through the
--     `posts_public` / `comments_public` views below, which null out author identity
--     for anonymous rows and never select author_id itself.
--   * Vote/save/report rows are similarly locked to "your own rows only" — nobody but
--     the backend gets to read who-voted-for-what or the moderation queue.

-- ---------------------------------------------------------------------------
-- Helper: map the Supabase auth session to our internal users.id
-- ---------------------------------------------------------------------------
create or replace function app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from users where auth_user_id = auth.uid()
$$;

-- Single source of truth for "can the current session see this PG" (PRD §11:
-- member, or the PG has crossed the public-listing threshold). Both the pgs
-- RLS policy below and the posts_public/comments_public views call this, so
-- the rule can't drift between the two enforcement points.
create or replace function pg_is_visible(p_pg_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from pg_memberships m
      where m.pg_id = p_pg_id and m.user_id = app_user_id()
    )
    or (
      select count(distinct author_id) from posts p
      where p.pg_id = p_pg_id and not p.is_removed
    ) >= 3
    or (
      select count(*) from posts p
      where p.pg_id = p_pg_id and p.type = 'review' and not p.is_removed
    ) >= 5
$$;

-- ---------------------------------------------------------------------------
-- Lock every table down, then grant back only what's needed
-- ---------------------------------------------------------------------------
alter table users            enable row level security;
alter table pgs               enable row level security;
alter table pg_memberships   enable row level security;
alter table posts             enable row level security;
alter table comments          enable row level security;
alter table votes             enable row level security;
alter table saved_posts      enable row level security;
alter table reports           enable row level security;
alter table notifications    enable row level security;

alter table users            force row level security;
alter table pgs               force row level security;
alter table pg_memberships   force row level security;
alter table posts             force row level security;
alter table comments          force row level security;
alter table votes             force row level security;
alter table saved_posts      force row level security;
alter table reports           force row level security;
alter table notifications    force row level security;

-- posts/comments/users carry data that must never leak raw to anon/authenticated —
-- those roles only ever read them through the redacting views below.
revoke all on users, posts, comments from anon, authenticated;

-- ---------------------------------------------------------------------------
-- users — read/update only your own row; rows are created by a signup trigger
-- (service_role), never directly by the client.
-- ---------------------------------------------------------------------------
create policy users_select_self on users
  for select to authenticated
  using (auth_user_id = auth.uid());

create policy users_update_self on users
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- pgs — visible if you're a member, or if it's crossed the PRD §11 public
-- threshold (>=3 distinct posting accounts or >=5 reviews). Founding a PG is
-- the only client-side write; edits go through the backend.
-- ---------------------------------------------------------------------------
create policy pgs_select_visible on pgs
  for select to anon, authenticated
  using (pg_is_visible(pgs.id));

create policy pgs_insert_founder on pgs
  for insert to authenticated
  with check (founding_user_id = app_user_id());

-- ---------------------------------------------------------------------------
-- pg_memberships — you can see and manage only your own membership rows.
-- Member *counts* are public via the pg_stats view, not raw membership rows,
-- so who-belongs-to-what-PG isn't scrapeable.
-- ---------------------------------------------------------------------------
create policy pg_memberships_select_self on pg_memberships
  for select to authenticated
  using (user_id = app_user_id());

create policy pg_memberships_insert_self on pg_memberships
  for insert to authenticated
  with check (user_id = app_user_id());

create policy pg_memberships_delete_self on pg_memberships
  for delete to authenticated
  using (user_id = app_user_id());

-- ---------------------------------------------------------------------------
-- posts / comments — no direct select for anon/authenticated (revoked above).
-- Insert only as yourself, into a PG you belong to; edits/removal are a
-- moderation action taken by the backend under service_role, not the client.
-- ---------------------------------------------------------------------------
create policy posts_insert_self on posts
  for insert to authenticated
  with check (
    author_id = app_user_id()
    and exists (
      select 1 from pg_memberships m
      where m.pg_id = posts.pg_id and m.user_id = app_user_id()
    )
  );

create policy comments_insert_self on comments
  for insert to authenticated
  with check (author_id = app_user_id());

-- ---------------------------------------------------------------------------
-- votes — you can only see/change your own vote, never anyone else's.
-- Aggregate up/down counts are exposed via posts_public/comments_public.
-- ---------------------------------------------------------------------------
create policy votes_select_self on votes
  for select to authenticated
  using (user_id = app_user_id());

create policy votes_upsert_self on votes
  for insert to authenticated
  with check (user_id = app_user_id());

create policy votes_update_self on votes
  for update to authenticated
  using (user_id = app_user_id())
  with check (user_id = app_user_id());

create policy votes_delete_self on votes
  for delete to authenticated
  using (user_id = app_user_id());

-- ---------------------------------------------------------------------------
-- saved_posts — your own bookmarks only.
-- ---------------------------------------------------------------------------
create policy saved_posts_select_self on saved_posts
  for select to authenticated
  using (user_id = app_user_id());

create policy saved_posts_insert_self on saved_posts
  for insert to authenticated
  with check (user_id = app_user_id());

create policy saved_posts_delete_self on saved_posts
  for delete to authenticated
  using (user_id = app_user_id());

-- ---------------------------------------------------------------------------
-- reports — anyone can file one as themselves; nobody but the backend
-- (service_role) can read the moderation queue. No select policy for
-- anon/authenticated means the table is unreadable to them by default.
-- ---------------------------------------------------------------------------
create policy reports_insert_self on reports
  for insert to authenticated
  with check (reporter_id = app_user_id());

-- ---------------------------------------------------------------------------
-- notifications — your own inbox only; rows are written by the backend
-- (service_role) on the triggering event, not by the client.
-- ---------------------------------------------------------------------------
create policy notifications_select_self on notifications
  for select to authenticated
  using (user_id = app_user_id());

create policy notifications_update_self on notifications
  for update to authenticated
  using (user_id = app_user_id())
  with check (user_id = app_user_id());

-- ---------------------------------------------------------------------------
-- Public, anonymity-safe read views. These are what the frontend actually
-- queries — never the raw posts/comments/users tables.
-- ---------------------------------------------------------------------------
-- These views intentionally run with the view owner's privileges (Postgres's
-- default — no security_invoker), i.e. as the migration role, which is why
-- FORCE ROW LEVEL SECURITY above doesn't stop them from aggregating across
-- all rows. That's required for correct counts, but it also means the pgs
-- RLS policy is NOT what gates visibility here — pg_is_visible() is called
-- explicitly in each view's WHERE clause instead.
create or replace view pg_stats as
select
  pg.id as pg_id,
  count(distinct m.user_id) as member_count,
  count(*) filter (where p.type = 'review' and not p.is_removed) as review_count,
  round(avg(p.overall_rating) filter (where p.type = 'review' and not p.is_removed), 1) as aggregate_rating
from pgs pg
left join pg_memberships m on m.pg_id = pg.id
left join posts p on p.pg_id = pg.id
where pg_is_visible(pg.id)
group by pg.id;

create or replace view posts_public as
select
  p.id,
  p.pg_id,
  p.type,
  p.title,
  p.body,
  p.is_anonymous,
  case when p.is_anonymous then null else p.author_id end as author_id,
  case when p.is_anonymous then null else u.display_name end as author_display_name,
  case when p.is_anonymous then null else u.avatar_url end as author_avatar_url,
  p.residency_claim,
  p.rating_tags,
  p.overall_rating,
  p.poll_options,
  p.created_at,
  coalesce((select count(*) from votes v where v.target_type = 'post' and v.target_id = p.id and v.direction = 1), 0) as upvotes,
  coalesce((select count(*) from votes v where v.target_type = 'post' and v.target_id = p.id and v.direction = -1), 0) as downvotes,
  coalesce((select count(*) from comments c where c.post_id = p.id and not c.is_removed), 0) as comment_count
from posts p
join users u on u.id = p.author_id
where not p.is_removed
  and pg_is_visible(p.pg_id);

create or replace view comments_public as
select
  c.id,
  c.post_id,
  c.parent_comment_id,
  c.is_anonymous,
  case when c.is_anonymous then null else c.author_id end as author_id,
  case when c.is_anonymous then null else u.display_name end as author_display_name,
  case when c.is_anonymous then null else u.avatar_url end as author_avatar_url,
  c.body,
  c.created_at,
  coalesce((select count(*) from votes v where v.target_type = 'comment' and v.target_id = c.id and v.direction = 1), 0) as upvotes,
  coalesce((select count(*) from votes v where v.target_type = 'comment' and v.target_id = c.id and v.direction = -1), 0) as downvotes
from comments c
join users u on u.id = c.author_id
join posts p on p.id = c.post_id
where not c.is_removed
  and not p.is_removed
  and pg_is_visible(p.pg_id);

grant select on pg_stats, posts_public, comments_public to anon, authenticated;
