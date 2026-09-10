// Domain types — mirror the Postgres schema in docs/schema.sql.
// Anonymity model: every post/comment always has a real authorId server-side;
// isAnonymous is a display-layer flag only. The API must never send authorId
// to the client for anonymous content — these client-facing types reflect that
// by typing `author` as `AuthorView`, which is either a real identity or the
// generic anonymous tag, never both.

export type RatingTag =
  | "Safety"
  | "Food"
  | "Warden"
  | "Wifi"
  | "Curfew";

export const RATING_TAGS: RatingTag[] = ["Safety", "Food", "Warden", "Wifi", "Curfew"];

export type ChennaiArea =
  | "OMR-Sholinganallur"
  | "Thoraipakkam"
  | "Nungambakkam"
  | "Velachery"
  | "Anna Nagar";

export const CHENNAI_AREAS: ChennaiArea[] = [
  "OMR-Sholinganallur",
  "Thoraipakkam",
  "Nungambakkam",
  "Velachery",
  "Anna Nagar",
];

export interface AuthorView {
  isAnonymous: boolean;
  /** Only present when isAnonymous is false. */
  displayName?: string;
  /** Only present when isAnonymous is false. */
  avatarUrl?: string;
  /** Generic tag shown instead of an identity, e.g. "Anonymous Resident". */
  anonymousTag?: string;
}

export interface Pg {
  id: string;
  name: string;
  area: ChennaiArea;
  address?: string;
  coverImageUrl?: string;
  memberCount: number;
  reviewCount: number;
  /** Weighted mean across all structured review ratings, 1-5. Null until the PG has its first review. */
  aggregateRating: number | null;
  tagAverages: Partial<Record<RatingTag, number>>;
  /** Per PRD §11: below the visibility threshold, the page exists but is only shown to members. */
  isPubliclyVisible: boolean;
  createdAt: string;
}

export type PostType = "review" | "discussion" | "poll";

export interface PollOption {
  id: string;
  label: string;
  voteCount: number;
}

export interface Post {
  id: string;
  pgId: string;
  type: PostType;
  title: string;
  body: string;
  author: AuthorView;
  /** Soft honesty prompt per PRD §5.2 — not enforced server-side in v1. */
  residencyClaim?: "stayed_here" | "currently_here" | null;
  ratingTags?: Partial<Record<RatingTag, number>>;
  overallRating?: number;
  /** Hashtag-style topics on discussion posts, e.g. ["Privacy", "Warden"] — PRD §5.6 tag browse. */
  topics?: string[];
  pollOptions?: PollOption[];
  /** Option id the current user voted for, or null if they haven't voted yet. */
  myPollVote?: string | null;
  imageUrl?: string;
  linkUrl?: string;
  upvotes: number;
  downvotes: number;
  myVote: 1 | -1 | 0;
  commentCount: number;
  isSaved: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  author: AuthorView;
  body: string;
  upvotes: number;
  downvotes: number;
  myVote: 1 | -1 | 0;
  createdAt: string;
}

export type ReportReason =
  | "harassment"
  | "fake_review"
  | "doxxing"
  | "spam"
  | "other";

export interface Report {
  id: string;
  targetType: "post" | "comment";
  targetId: string;
  reason: ReportReason;
  detail?: string;
  createdAt: string;
  status: "pending" | "actioned" | "dismissed";
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  city: string;
  pgsLivedAt: string[];
  savedPgIds: string[];
  joinedPgIds: string[];
  accountCreatedAt: string;
}

/**
 * In-app notification. Per PRD §5.4.1, dispatch to push/email must render from
 * a generic template and never forward pgName/postExcerpt/isAnonymous — that
 * redaction happens at the dispatch boundary, not here; this type is the
 * full-detail in-app shape only.
 */
export interface AppNotification {
  id: string;
  type: "reply" | "upvote" | "mention" | "report_resolved";
  pgId: string;
  pgName: string;
  postId: string;
  postExcerpt: string;
  /** Whether the *notified user's own* post/comment was anonymous. */
  wasAnonymous: boolean;
  isRead: boolean;
  createdAt: string;
}
