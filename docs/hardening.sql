-- SheStays Community — least-privilege grant hardening
-- Run once after docs/schema.sql and docs/rls-policies.sql.
--
-- Why this file exists: Supabase grants ALL (including TRUNCATE, which RLS
-- cannot restrict — it's a table-level, not row-level, privilege) to anon
-- and authenticated on every table by default. rls-policies.sql only
-- explicitly revoked that default on users/posts/comments, which also
-- stripped the SELECT/UPDATE grants those tables' own policies depend on
-- (a policy without a matching GRANT is unreachable — RLS filters rows,
-- it doesn't substitute for the underlying privilege). Every other table
-- (pgs, pg_memberships, votes, saved_posts, reports, notifications) was
-- left with the unrestricted default grant. This file resets every table
-- to exactly the privileges its RLS policies use, nothing more.

-- Start from zero on every base table + view, for both client-facing roles.
revoke all on all tables in schema public from anon, authenticated;

-- Make sure future tables/views created by this migration role don't
-- silently re-inherit Supabase's wide-open default again.
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- users — self read/update only (matches users_select_self / users_update_self).
-- anon gets nothing: there is no anon policy on this table.
grant select, update on users to authenticated;

-- pgs — publicly readable once visible (pgs_select_visible), founder can insert.
grant select on pgs to anon, authenticated;
grant insert on pgs to authenticated;

-- pg_memberships — manage only your own membership rows.
grant select, insert, delete on pg_memberships to authenticated;

-- posts / comments — no direct read (client reads via posts_public /
-- comments_public); insert only as yourself, subject to the RLS check.
grant insert on posts to authenticated;
grant insert on comments to authenticated;

-- votes — read/write only your own vote row.
grant select, insert, update, delete on votes to authenticated;

-- saved_posts — your own bookmarks only.
grant select, insert, delete on saved_posts to authenticated;

-- reports — file one as yourself; the moderation queue itself is
-- service_role-only (no select policy exists for anon/authenticated).
grant insert on reports to authenticated;

-- notifications — read/mark-read your own inbox; rows are written by the
-- backend under service_role, so no insert grant for authenticated.
grant select, update on notifications to authenticated;

-- Anonymity-safe read views — select only, and these views aggregate/join
-- so they're not auto-updatable in Postgres anyway, but keep grants exact.
grant select on pg_stats, posts_public, comments_public to anon, authenticated;

-- Sanity check: no anon/authenticated grant anywhere should include TRUNCATE.
do $$
declare
  leftover record;
begin
  for leftover in
    select table_name, grantee, privilege_type
    from information_schema.table_privileges
    where table_schema = 'public'
      and grantee in ('anon', 'authenticated')
      and privilege_type = 'TRUNCATE'
  loop
    raise exception 'TRUNCATE still granted: % to %', leftover.table_name, leftover.grantee;
  end loop;
end $$;
