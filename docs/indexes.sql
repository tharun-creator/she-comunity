-- SheStays Community — Performance Indexes
-- Run after schema.sql and rls-policies.sql
-- Optimizes pg_is_visible() and common query patterns

-- 1. Index for pg_is_visible() subqueries
-- Counts distinct author_ids for posts in a PG (for visibility threshold)
CREATE INDEX IF NOT EXISTS idx_posts_pg_id_author_id_not_removed
ON posts (pg_id, author_id)
WHERE NOT is_removed;

-- Count reviews for a PG
CREATE INDEX IF NOT EXISTS idx_posts_pg_id_type_review_not_removed
ON posts (pg_id, type)
WHERE type = 'review' AND NOT is_removed;

-- 2. Index for area-based PG browsing with visibility
CREATE INDEX IF NOT EXISTS idx_pgs_area_is_publicly_visible
ON pgs (area, is_publicly_visible)
WHERE is_publicly_visible;

-- 3. Index for user's PG memberships
CREATE INDEX IF NOT EXISTS idx_pg_memberships_user_id
ON pg_memberships (user_id);

-- 4. Index for post queries by PG with sort
-- New sort (created_at desc)
CREATE INDEX IF NOT EXISTS idx_posts_pg_id_created_at_desc_not_removed
ON posts (pg_id, created_at DESC)
WHERE NOT is_removed;

-- Top sort (upvotes - downvotes desc) - requires computed column or expression index
-- Using expression index for vote score
CREATE INDEX IF NOT EXISTS idx_posts_pg_id_vote_score_not_removed
ON posts (pg_id, (upvotes - downvotes) DESC)
WHERE NOT is_removed;

-- Discussed sort (comment_count desc)
CREATE INDEX IF NOT EXISTS idx_posts_pg_id_comment_count_not_removed
ON posts (pg_id, comment_count DESC)
WHERE NOT is_removed;

-- 5. Index for notifications pagination
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read_created_at_desc
ON notifications (user_id, is_read, created_at DESC);

-- 6. Index for comments threading
CREATE INDEX IF NOT EXISTS idx_comments_post_id_parent_comment_id
ON comments (post_id, parent_comment_id);

-- 7. Index for votes by user (for vote checking)
CREATE INDEX IF NOT EXISTS idx_votes_user_id_target_type_target_id
ON votes (user_id, target_type, target_id);

-- 8. Index for reports moderation queue
CREATE INDEX IF NOT EXISTS idx_reports_status_created_at
ON reports (status, created_at DESC);

-- 9. Index for users by auth_user_id (for auth lookups)
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id
ON users (auth_user_id);

-- 10. Composite index for post author lookups
CREATE INDEX IF NOT EXISTS idx_posts_author_id_not_removed
ON posts (author_id)
WHERE NOT is_removed;

-- 11. Index for search (full-text search will be added in Phase 6)
-- CREATE INDEX IF NOT EXISTS idx_pgs_search_tsv ON pgs USING GIN (search_tsv);
-- CREATE INDEX IF NOT EXISTS idx_posts_search_tsv ON posts USING GIN (search_tsv);

-- 12. Partition notifications by month (for high write volume)
-- Run as separate migration after testing
-- CREATE TABLE notifications_partitioned (LIKE notifications INCLUDING ALL) PARTITION BY RANGE (created_at);
-- CREATE TABLE notifications_2024_01 PARTITION OF notifications_partitioned FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- etc.

-- Verify indexes
DO $$
DECLARE
    idx record;
BEGIN
    FOR idx IN
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
    LOOP
        RAISE NOTICE 'Index exists: %.%', idx.tablename, idx.indexname;
    END LOOP;
END $$;