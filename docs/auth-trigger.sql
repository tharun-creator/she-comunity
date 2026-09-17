-- SheStays Community — Supabase Auth Trigger
-- Run this in Supabase SQL Editor after enabling Email OTP provider
-- This trigger creates a users table row when a new auth user signs up

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_user_id, display_name, city, phone_verified_at, women_attested_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'city', 'Chennai'),
    case when new.email_confirmed_at is not null then new.email_confirmed_at else null end,
    null -- women_attested_at set separately via attestation checkbox
  );
  return new;
end;
$$;

-- Trigger on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update women_attested_at when user attests
create or replace function public.attest_woman(user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set women_attested_at = now()
  where auth_user_id = user_id
    and women_attested_at is null;
end;
$$;

grant execute on function public.attest_woman(uuid) to authenticated;