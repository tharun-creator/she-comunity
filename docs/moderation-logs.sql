# SheStays Community — Moderation Logs & Staff Column
-- Run this migration after schema.sql and rls-policies.sql

-- Add is_staff column to users table
alter table users add column if not exists is_staff boolean not null default false;

-- Create moderation_logs table for audit trail
create table if not exists moderation_logs (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references users(id),
  action text not null check (action in ('hide', 'remove', 'dismiss', 'ban_user', 'unban', 'verify')),
  target_type text not null check (target_type in ('post', 'comment', 'user')),
  target_id uuid not null,
  target_preview text,
  reason text,
  created_at timestamptz not null default now()
);

-- Indexes for moderation logs
create index if not exists idx_moderation_logs_moderator_id_created_at on moderation_logs (moderator_id, created_at desc);
create index if not exists idx_moderation_logs_target_type_target_id on moderation_logs (target_type, target_id);
create index if not exists idx_moderation_logs_action_created_at on moderation_logs (action, created_at desc);

-- RLS policies for moderation_logs
alter table moderation_logs enable row level security;
alter table moderation_logs force row level security;

-- Only staff can read moderation logs
create policy moderation_logs_select_staff on moderation_logs
  for select to authenticated
  using (
    exists (
      select 1 from users u
      where u.auth_user_id = auth.uid() and u.is_staff = true
    )
  );

-- Staff can insert moderation logs
create policy moderation_logs_insert_staff on moderation_logs
  for insert to authenticated
  with check (
    exists (
      select 1 from users u
      where u.auth_user_id = auth.uid() and u.is_staff = true
    )
  );

-- Grant select/insert to authenticated (staff only via policy)
grant select, insert on moderation_logs to authenticated;

-- Add is_staff index
create index if not exists idx_users_is_staff on users (is_staff) where is_staff = true;