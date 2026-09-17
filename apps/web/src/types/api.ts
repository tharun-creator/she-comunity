// Backend API response types (matching FastAPI schemas)

export interface Pg {
  id: string;
  name: string;
  area: string;
  address?: string;
  founding_user_id: string;
  member_count: number;
  review_count: number;
  aggregate_rating?: number;
  tag_averages: Record<string, number>;
  is_publicly_visible: boolean;
  created_at: string;
}

export interface PgStats {
  member_count: number;
  review_count: number;
  aggregate_rating?: number;
  tag_averages: Record<string, number>;
}

export interface PgWithStats extends Pg {
  stats: PgStats;
}

export interface PgListResponse {
  data: Pg[];
  next_cursor?: string;
  has_more: boolean;
}

export interface PGSearchParams {
  q?: string;
  area?: string;
  limit?: number;
  cursor?: string;
}

export interface AuthorView {
  is_anonymous: boolean;
  display_name?: string;
  avatar_url?: string;
  anonymous_tag?: string;
}

export interface Post {
  id: string;
  pg_id: string;
  type: "review" | "discussion" | "poll";
  title: string;
  body: string;
  author: AuthorView;
  residency_claim?: "stayed_here" | "currently_here" | null;
  rating_tags?: Record<string, number>;
  overall_rating?: number;
  poll_options?: Array<{ id: string; label: string; vote_count: number }>;
  image_url?: string;
  link_url?: string;
  topics?: string[];
  my_vote: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  my_poll_vote?: string | null;
  is_saved: boolean;
  is_removed: boolean;
  created_at: string;
}

export interface PostListResponse {
  data: Post[];
  next_cursor?: string;
  has_more: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_comment_id?: string | null;
  author: AuthorView;
  body: string;
  my_vote: number;
  upvotes: number;
  downvotes: number;
  is_removed: boolean;
  created_at: string;
  replies?: Comment[];
}

export interface CommentListResponse {
  data: Comment[];
  next_cursor?: string;
  has_more: boolean;
}

export interface VoteResponse {
  upvotes: number;
  downvotes: number;
  my_vote: number;
}

export interface PollVoteResponse {
  poll_options: Array<{ id: string; label: string; vote_count: number; is_my_vote: boolean }>;
  my_poll_vote?: string | null;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: "post" | "comment";
  target_id: string;
  reason: string;
  detail?: string;
  status: "pending" | "actioned" | "dismissed";
  created_at: string;
}

export interface ReportListResponse {
  data: Report[];
  next_cursor?: string;
  has_more: boolean;
}

export interface Notification {
  id: string;
  type: "reply" | "upvote" | "mention" | "report_resolved";
  pg_id: string;
  pg_name: string;
  post_id: string;
  post_excerpt: string;
  was_anonymous: boolean;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  data: Notification[];
  next_cursor?: string;
  has_more: boolean;
}

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  city: string;
  pgs_lived_at: string[];
  saved_pg_ids: string[];
  joined_pg_ids: string[];
  account_created_at: string;
  phone_verified_at?: string;
  women_attested_at?: string;
}

export interface UserMembership {
  pg_id: string;
  pg_name: string;
  area: string;
  joined_at: string;
}

export interface UserMembershipsResponse {
  data: UserMembership[];
  next_cursor?: string;
  has_more: boolean;
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  database_connected: boolean;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    request_id: string;
    details?: Record<string, any>;
  };
}