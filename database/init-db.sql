-- SheStays Community — Local Development Database Initialization
-- This script runs automatically on first database startup via Docker entrypoint
-- It creates the schema and seeds realistic mock data for local development

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    city TEXT NOT NULL,
    avatar_url TEXT,
    phone_verified_at TIMESTAMPTZ,
    women_attested_at TIMESTAMPTZ,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    banned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PGs (PG Hostels) TABLE
-- ============================================
CREATE TABLE pgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    area TEXT NOT NULL CHECK (area IN (
        'OMR-Sholinganallur', 'Thoraipakkam', 'Nungambakkam', 'Velachery', 'Anna Nagar'
    )),
    address TEXT,
    cover_image_url TEXT,
    founding_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PG MEMBERSHIPS TABLE
-- ============================================
CREATE TABLE pg_memberships (
    pg_id UUID NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (pg_id, user_id)
);

-- ============================================
-- POSTS TABLE
-- ============================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pg_id UUID NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    type TEXT NOT NULL CHECK (type IN ('review', 'discussion', 'poll')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    residency_claim TEXT CHECK (residency_claim IN ('stayed_here', 'currently_here')),
    rating_tags JSONB,
    overall_rating NUMERIC(2,1),
    poll_options JSONB,
    is_removed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    body TEXT NOT NULL,
    is_removed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- VOTES TABLE
-- ============================================
CREATE TABLE votes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'poll')),
    target_id UUID NOT NULL,
    direction SMALLINT NOT NULL CHECK (direction IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, target_type, target_id)
);

-- ============================================
-- SAVED POSTS TABLE
-- ============================================
CREATE TABLE saved_posts (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('harassment', 'fake_review', 'doxxing', 'spam', 'other')),
    detail TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'actioned', 'dismissed')),
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('reply', 'upvote', 'mention', 'report_resolved')),
    pg_id UUID REFERENCES pgs(id) ON DELETE SET NULL,
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    pg_name TEXT,
    post_excerpt TEXT,
    was_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- MODERATION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL CHECK (action IN ('hide', 'remove', 'dismiss', 'ban_user', 'unban', 'verify')),
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
    target_id UUID NOT NULL,
    target_preview TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX ON posts (pg_id, created_at DESC);
CREATE INDEX ON comments (post_id, parent_comment_id);
CREATE INDEX ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX ON reports (status, created_at);
CREATE INDEX ON moderation_logs (moderator_id, created_at DESC);
CREATE INDEX ON moderation_logs (target_type, target_id);
CREATE INDEX ON moderation_logs (action, created_at DESC);

-- ============================================
-- FULL-TEXT SEARCH COLUMNS AND TRIGGERS
-- ============================================
ALTER TABLE pgs ADD COLUMN IF NOT EXISTS search_tsv TSVECTOR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_tsv TSVECTOR;

CREATE INDEX IF NOT EXISTS pgs_search_tsv_idx ON pgs USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS posts_search_tsv_idx ON posts USING GIN (search_tsv);

-- Trigger functions for automatic tsvector updates
CREATE OR REPLACE FUNCTION pgs_search_tsv_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.search_tsv :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.area, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.address, '')), 'C');
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION posts_search_tsv_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.search_tsv :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'B');
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS pgs_search_tsv_trigger ON pgs;
CREATE TRIGGER pgs_search_tsv_trigger
BEFORE INSERT OR UPDATE ON pgs
FOR EACH ROW EXECUTE FUNCTION pgs_search_tsv_update();

DROP TRIGGER IF EXISTS posts_search_tsv_trigger ON posts;
CREATE TRIGGER posts_search_tsv_trigger
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION posts_search_tsv_update();

-- ============================================
-- VIEWS AND VISIBILITY FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION pg_is_visible(p_pg_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    (
      SELECT COUNT(DISTINCT author_id) FROM posts p
      WHERE p.pg_id = p_pg_id AND NOT p.is_removed
    ) >= 3
    OR (
      SELECT COUNT(*) FROM posts p
      WHERE p.pg_id = p_pg_id AND p.type = 'review' AND NOT p.is_removed
    ) >= 5;
$$;

CREATE OR REPLACE VIEW pg_stats AS
SELECT
  pg.id AS pg_id,
  COUNT(DISTINCT m.user_id) AS member_count,
  COUNT(*) FILTER (WHERE p.type = 'review' AND NOT p.is_removed) AS review_count,
  ROUND(AVG(p.overall_rating) FILTER (WHERE p.type = 'review' AND NOT p.is_removed), 1) AS aggregate_rating
FROM pgs pg
LEFT JOIN pg_memberships m ON m.pg_id = pg.id
LEFT JOIN posts p ON p.pg_id = pg.id
GROUP BY pg.id;

CREATE OR REPLACE VIEW posts_public AS
SELECT
  p.id,
  p.pg_id,
  p.type,
  p.title,
  p.body,
  p.is_anonymous,
  CASE WHEN p.is_anonymous THEN NULL ELSE p.author_id END AS author_id,
  CASE WHEN p.is_anonymous THEN NULL ELSE u.display_name END AS author_display_name,
  CASE WHEN p.is_anonymous THEN NULL ELSE u.avatar_url END AS author_avatar_url,
  p.residency_claim,
  p.rating_tags,
  p.overall_rating,
  p.poll_options,
  p.created_at,
  COALESCE((SELECT COUNT(*) FROM votes v WHERE v.target_type = 'post' AND v.target_id = p.id AND v.direction = 1), 0) AS upvotes,
  COALESCE((SELECT COUNT(*) FROM votes v WHERE v.target_type = 'post' AND v.target_id = p.id AND v.direction = -1), 0) AS downvotes,
  COALESCE((SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND NOT c.is_removed), 0) AS comment_count
FROM posts p
JOIN users u ON u.id = p.author_id
WHERE NOT p.is_removed;

CREATE OR REPLACE VIEW comments_public AS
SELECT
  c.id,
  c.post_id,
  c.parent_comment_id,
  c.is_anonymous,
  CASE WHEN c.is_anonymous THEN NULL ELSE c.author_id END AS author_id,
  CASE WHEN c.is_anonymous THEN NULL ELSE u.display_name END AS author_display_name,
  CASE WHEN c.is_anonymous THEN NULL ELSE u.avatar_url END AS author_avatar_url,
  c.body,
  c.created_at,
  COALESCE((SELECT COUNT(*) FROM votes v WHERE v.target_type = 'comment' AND v.target_id = c.id AND v.direction = 1), 0) AS upvotes,
  COALESCE((SELECT COUNT(*) FROM votes v WHERE v.target_type = 'comment' AND v.target_id = c.id AND v.direction = -1), 0) AS downvotes
FROM comments c
JOIN users u ON u.id = c.author_id
JOIN posts p ON p.id = c.post_id
WHERE NOT c.is_removed
  AND NOT p.is_removed;

-- ============================================
-- SEED DATA FOR LOCAL DEVELOPMENT
-- ============================================

-- Deterministic UUIDs for consistent seeding
-- These are fixed UUIDs so the same data is created every time

-- Seed Users (5 test users)
INSERT INTO users (id, auth_user_id, display_name, city, avatar_url, phone_verified_at, women_attested_at, is_staff, created_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Priya Sharma', 'Chennai', NULL, NOW(), NOW(), TRUE, NOW()),
    ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Anjali Patel', 'Chennai', NULL, NOW(), NOW(), FALSE, NOW()),
    ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Meera Reddy', 'Chennai', NULL, NOW(), NOW(), FALSE, NOW()),
    ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Kavya Nair', 'Chennai', NULL, NOW(), NOW(), FALSE, NOW()),
    ('55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Divya Krishnan', 'Chennai', NULL, NOW(), NOW(), FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed PGs (5 PGs across Chennai areas)
INSERT INTO pgs (id, name, area, address, cover_image_url, founding_user_id, created_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sunrise Ladies PG', 'OMR-Sholinganallur', '123 OMR Road, Sholinganallur', NULL, '11111111-1111-1111-1111-111111111111', NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Green Valley PG', 'Thoraipakkam', '456 Thoraipakkam Main Road', NULL, '22222222-2222-2222-2222-222222222222', NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Comfort Stay PG', 'Nungambakkam', '789 Nungambakkam High Road', NULL, '33333333-3333-3333-3333-333333333333', NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Harmony PG', 'Velachery', '321 Velachery Bypass Road', NULL, '44444444-4444-4444-4444-444444444444', NOW()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Serene Residency', 'Anna Nagar', '654 Anna Nagar East', NULL, '55555555-5555-5555-5555-555555555555', NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed PG Memberships (each user is member of their founded PG + 1 other)
INSERT INTO pg_memberships (pg_id, user_id, joined_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555555', NOW()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', NOW()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', NOW())
ON CONFLICT (pg_id, user_id) DO NOTHING;

-- Seed Posts (reviews, discussions, polls)
INSERT INTO posts (id, pg_id, author_id, is_anonymous, type, title, body, residency_claim, rating_tags, overall_rating, poll_options, created_at) VALUES
    -- Reviews
    ('p1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', FALSE, 'review', 'Great PG with excellent security', 'Been staying here for 6 months. The security is top-notch with 24/7 guards and CCTV. Food is decent, warden is responsive.', 'currently_here', '{"Safety": 5, "Food": 4, "Warden": 5, "Wifi": 4, "Curfew": 3}', 4.2, NULL, NOW() - INTERVAL '5 days'),
    ('p2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', FALSE, 'review', 'Good value for money', 'Affordable PG with good amenities. Food could be better but overall satisfied with the stay.', 'stayed_here', '{"Safety": 4, "Food": 3, "Warden": 4, "Wifi": 5, "Curfew": 4}', 4.0, NULL, NOW() - INTERVAL '10 days'),
    ('p3333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', TRUE, 'review', 'Anonymous review - very safe', 'Feeling very safe here. The warden is strict but fair. Good wifi for work from home.', 'currently_here', '{"Safety": 5, "Food": 4, "Warden": 4, "Wifi": 5, "Curfew": 3}', 4.2, NULL, NOW() - INTERVAL '2 days'),

    -- Discussions
    ('p4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', FALSE, 'discussion', 'Best places to eat near Sholinganallur?', 'Looking for good lunch spots near the PG. Any recommendations for vegetarian food?', NULL, NULL, NULL, NULL, NOW() - INTERVAL '3 days'),
    ('p5555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', TRUE, 'discussion', 'Warden timings discussion', 'Our warden locks the gate at 10 PM sharp. Is this common across PGs in Chennai?', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),

    -- Poll
    ('p6666666-6666-6666-6666-666666666666', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', FALSE, 'poll', 'Preferred curfew time for weekends', 'What should be the ideal weekend curfew time?', NULL, NULL, NULL, '[{"id": "opt-1", "label": "10 PM", "voteCount": 0}, {"id": "opt-2", "label": "11 PM", "voteCount": 0}, {"id": "opt-3", "label": "12 AM", "voteCount": 0}, {"id": "opt-4", "label": "No curfew", "voteCount": 0}]', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- Seed Comments
INSERT INTO comments (id, post_id, parent_comment_id, author_id, is_anonymous, body, created_at) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'p4444444-4444-4444-4444-444444444444', NULL, '33333333-3333-3333-3333-333333333333', FALSE, 'Try the mess at IIIT campus - great veg food!', NOW() - INTERVAL '2 days'),
    ('c2222222-2222-2222-2222-222222222222', 'p4444444-4444-4444-4444-444444444444', NULL, '44444444-4444-4444-4444-444444444444', TRUE, 'Saravana Bhavan on OMR is good too', NOW() - INTERVAL '2 days'),
    ('c3333333-3333-3333-3333-333333333333', 'p4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', FALSE, 'Thanks! Will check it out.', NOW() - INTERVAL '1 day'),
    ('c4444444-4444-4444-4444-444444444444', 'p5555555-5555-5555-5555-555555555555', NULL, '11111111-1111-1111-1111-111111111111', FALSE, 'Yes, 10 PM is standard. Some PGs allow 11 PM on weekends.', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- Seed Votes
INSERT INTO votes (user_id, target_type, target_id, direction, created_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'post', 'p1111111-1111-1111-1111-111111111111', 1, NOW()),
    ('22222222-2222-2222-2222-222222222222', 'post', 'p1111111-1111-1111-1111-111111111111', 1, NOW()),
    ('33333333-3333-3333-3333-333333333333', 'post', 'p2222222-2222-2222-2222-222222222222', 1, NOW()),
    ('44444444-4444-4444-4444-444444444444', 'post', 'p3333333-3333-3333-3333-333333333333', 1, NOW()),
    ('55555555-5555-5555-5555-555555555555', 'comment', 'c1111111-1111-1111-1111-111111111111', 1, NOW())
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- Seed Notifications
INSERT INTO notifications (id, user_id, type, pg_id, post_id, was_anonymous, is_read, created_at) VALUES
    ('n1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'reply', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'p4444444-4444-4444-4444-444444444444', FALSE, FALSE, NOW() - INTERVAL '1 day'),
    ('n2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'upvote', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'p1111111-1111-1111-1111-111111111111', FALSE, FALSE, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- Trigger search_tsv calculation for seed data
UPDATE pgs SET name = name;
UPDATE posts SET title = title;

-- ============================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as pg_count FROM pgs;
-- SELECT COUNT(*) as post_count FROM posts;
-- SELECT COUNT(*) as comment_count FROM comments;
-- SELECT * FROM pgs WHERE search_tsv @@ plainto_tsquery('english', 'sunrise');
-- SELECT * FROM posts WHERE search_tsv @@ plainto_tsquery('english', 'security');