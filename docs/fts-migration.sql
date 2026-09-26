-- SheStays Community — FTS Migration for Phase 6
-- Add tsvector columns and GIN indexes for full-text search
-- Run this against your Supabase project via SQL Editor or psql

-- Enable pg_trgm for similarity search (optional but useful)
create extension if not exists "pg_trgm";

-- 1. Add search_tsv column to pgs table
alter table pgs add column if not exists search_tsv tsvector;

-- 2. Create GIN index on pgs.search_tsv
create index if not exists pgs_search_tsv_idx on pgs using gin (search_tsv);

-- 3. Create trigger function to update pgs.search_tsv
create or replace function pgs_search_tsv_update()
returns trigger language plpgsql as $$
begin
    new.search_tsv :=
        setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(new.area, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(new.address, '')), 'C');
    return new;
end $$;

-- 4. Create trigger on pgs insert/update
drop trigger if exists pgs_search_tsv_trigger on pgs;
create trigger pgs_search_tsv_trigger
before insert or update on pgs
for each row execute function pgs_search_tsv_update();

-- 5. Backfill existing pgs rows
update pgs set search_tsv = 
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(area, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(address, '')), 'C')
where search_tsv is null;

-- 6. Add search_tsv column to posts table
alter table posts add column if not exists search_tsv tsvector;

-- 7. Create GIN index on posts.search_tsv
create index if not exists posts_search_tsv_idx on posts using gin (search_tsv);

-- 8. Create trigger function to update posts.search_tsv
create or replace function posts_search_tsv_update()
returns trigger language plpgsql as $$
begin
    new.search_tsv :=
        setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(new.body, '')), 'B');
    return new;
end $$;

-- 9. Create trigger on posts insert/update
drop trigger if exists posts_search_tsv_trigger on posts;
create trigger posts_search_tsv_trigger
before insert or update on posts
for each row execute function posts_search_tsv_update();

-- 10. Backfill existing posts rows
update posts set search_tsv = 
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
where search_tsv is null;

-- 11. Cursor-based pagination support: add created_at index for posts (if not exists)
create index if not exists posts_pg_id_created_at_idx on posts (pg_id, created_at desc);
create index if not exists comments_post_id_created_at_idx on comments (post_id, created_at desc);
create index if not exists notifications_user_id_created_at_idx on notifications (user_id, created_at desc);
create index if not exists reports_status_created_at_idx on reports (status, created_at desc);
create index if not exists pgs_created_at_idx on pgs (created_at desc);