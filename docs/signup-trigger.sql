-- SheStays Community — signup trigger
-- Run once after docs/schema.sql, docs/rls-policies.sql, and docs/hardening.sql.
--
-- docs/rls-policies.sql:87 says "users — read/update only your own row; rows are
-- created by a signup trigger (service_role), never directly by the client." This
-- file is that trigger: it mirrors every new auth.users row into public.users,
-- reading the display_name/city/women_attested fields the client passed via
-- `supabase.auth.signUp({ options: { data: { ... } } })` (see
-- apps/web/src/app/(auth)/signup/page.tsx). Runs as the function owner
-- (security definer, typically postgres/service_role), bypassing the RLS that
-- otherwise blocks direct inserts into users from anon/authenticated.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_user_id, display_name, city, women_attested_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    coalesce(new.raw_user_meta_data->>'city', ''),
    case
      when (new.raw_user_meta_data->>'women_attested')::boolean is true then now()
      else null
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();
