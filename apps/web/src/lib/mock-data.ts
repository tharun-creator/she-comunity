import type { AppNotification, ChennaiArea, Comment, Pg, Post, UserProfile } from "@/types/domain";

// In-memory mock data store standing in for the FastAPI + Supabase backend
// (see docs/TECH-STACK.md). Every function here has the async signature the
// real API client will have, so screens don't need to change when it's swapped in.

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();

export const currentUser: UserProfile = {
  id: "u-me",
  displayName: "Priya S.",
  city: "Chennai",
  pgsLivedAt: ["pg-2"],
  savedPgIds: ["pg-1"],
  joinedPgIds: ["pg-1", "pg-2"],
  accountCreatedAt: hoursAgo(24 * 40),
};

const pgs: Pg[] = [
  {
    id: "pg-1",
    name: "Sunrise Ladies PG",
    area: "OMR-Sholinganallur",
    address: "2nd Cross Street, Sholinganallur",
    memberCount: 42,
    reviewCount: 18,
    aggregateRating: 4.2,
    tagAverages: { Safety: 4.5, Food: 3.8, Warden: 4.0, Wifi: 4.6, Curfew: 3.5 },
    isPubliclyVisible: true,
    createdAt: hoursAgo(24 * 200),
  },
  {
    id: "pg-2",
    name: "Green Nest Women's Hostel",
    area: "Thoraipakkam",
    address: "IT Expressway Service Road",
    memberCount: 29,
    reviewCount: 11,
    aggregateRating: 3.6,
    tagAverages: { Safety: 4.0, Food: 3.0, Warden: 3.2, Wifi: 3.9, Curfew: 4.0 },
    isPubliclyVisible: true,
    createdAt: hoursAgo(24 * 150),
  },
  {
    id: "pg-3",
    name: "Comfort Stay PG for Women",
    area: "Nungambakkam",
    address: undefined,
    memberCount: 15,
    reviewCount: 6,
    aggregateRating: 4.6,
    tagAverages: { Safety: 4.9, Food: 4.4, Warden: 4.7, Wifi: 4.2, Curfew: 4.5 },
    isPubliclyVisible: true,
    createdAt: hoursAgo(24 * 90),
  },
  {
    id: "pg-4",
    name: "Velachery Girls Hostel",
    area: "Velachery",
    memberCount: 2,
    reviewCount: 1,
    aggregateRating: 3.0,
    tagAverages: { Safety: 3.0 },
    // Below the §11 visibility threshold (< 3 accounts and < 5 reviews) — seed state, members-only.
    isPubliclyVisible: false,
    createdAt: hoursAgo(24 * 3),
  },
  {
    id: "pg-5",
    name: "Anna Nagar PG for Working Women",
    area: "Anna Nagar",
    memberCount: 33,
    reviewCount: 14,
    aggregateRating: 4.0,
    tagAverages: { Safety: 4.2, Food: 3.9, Warden: 3.8, Wifi: 4.1, Curfew: 3.9 },
    isPubliclyVisible: true,
    createdAt: hoursAgo(24 * 300),
  },
];

const posts: Post[] = [
  {
    id: "post-1",
    pgId: "pg-1",
    type: "review",
    title: "6 months in — honest review",
    body:
      "Been here since March. Warden is strict about the 9pm curfew but the building itself feels very safe — good lighting, CCTV at the gate. Food is average, lots of rice-heavy meals. Wifi is genuinely fast, better than my last place.",
    author: { isAnonymous: false, displayName: "Divya R." },
    residencyClaim: "currently_here",
    ratingTags: { Safety: 5, Food: 3, Warden: 4, Wifi: 5, Curfew: 3 },
    overallRating: 4,
    upvotes: 24,
    downvotes: 1,
    myVote: 0,
    commentCount: 0,
    isSaved: false,
    createdAt: hoursAgo(5),
  },
  {
    id: "post-2",
    pgId: "pg-1",
    type: "discussion",
    title: "Anyone else's warden reading room diaries?",
    body:
      "Not naming anyone, but I've noticed the warden going through the sign-in register and commenting on when people come back at night in front of other residents. Is this normal or should we raise it with management?",
    author: { isAnonymous: true, anonymousTag: "Anonymous Resident" },
    residencyClaim: "currently_here",
    topics: ["Privacy", "Warden", "Safety"],
    upvotes: 31,
    downvotes: 2,
    myVote: 0,
    commentCount: 3,
    isSaved: true,
    createdAt: hoursAgo(11),
  },
  {
    id: "post-6",
    pgId: "pg-1",
    type: "discussion",
    title: "Best time to visit the OMR area PGs before signing?",
    body:
      "Planning to shortlist a few PGs around Sholinganallur this weekend. Any tips on what to check in person that you can't tell from photos or reviews alone?",
    author: { isAnonymous: false, displayName: "Sneha R." },
    residencyClaim: "currently_here",
    topics: ["NewHere", "Tips"],
    upvotes: 12,
    downvotes: 0,
    myVote: 0,
    commentCount: 5,
    isSaved: false,
    createdAt: hoursAgo(3),
  },
  {
    id: "post-3",
    pgId: "pg-2",
    type: "poll",
    title: "Would you want a shared kitchen slot booking system?",
    body: "There have been fights over the induction stove in the evenings. Curious what people actually want.",
    author: { isAnonymous: false, displayName: "Meena K." },
    pollOptions: [
      { id: "opt-1", label: "Yes, book a slot", voteCount: 12 },
      { id: "opt-2", label: "No, first-come works fine", voteCount: 4 },
      { id: "opt-3", label: "Just add another stove", voteCount: 9 },
    ],
    upvotes: 10,
    downvotes: 0,
    myVote: 0,
    commentCount: 0,
    isSaved: false,
    createdAt: hoursAgo(30),
  },
  {
    id: "post-4",
    pgId: "pg-2",
    type: "review",
    title: "Left after 3 months — sharing why",
    body:
      "Rent was fair for the area but there was a landlord dispute over deposit refund that took weeks to resolve. Wanted to flag this before someone signs a long lease.",
    author: { isAnonymous: true, anonymousTag: "Anonymous Resident" },
    residencyClaim: "stayed_here",
    ratingTags: { Safety: 4, Food: 3, Warden: 3, Wifi: 4, Curfew: 4 },
    overallRating: 3,
    upvotes: 19,
    downvotes: 0,
    myVote: 0,
    commentCount: 0,
    isSaved: false,
    createdAt: hoursAgo(72),
  },
  {
    id: "post-5",
    pgId: "pg-3",
    type: "review",
    title: "Best PG I've stayed at in Chennai so far",
    body: "Small but well-run. The owner's family actually lives on-site which keeps it very safe. Food is homely.",
    author: { isAnonymous: false, displayName: "Anjali T." },
    residencyClaim: "currently_here",
    ratingTags: { Safety: 5, Food: 5, Warden: 5, Wifi: 4, Curfew: 5 },
    overallRating: 5,
    upvotes: 15,
    downvotes: 0,
    myVote: 0,
    commentCount: 0,
    isSaved: false,
    createdAt: hoursAgo(20),
  },
];

const comments: Comment[] = [
  {
    id: "c-1",
    postId: "post-2",
    parentCommentId: null,
    author: { isAnonymous: true, anonymousTag: "Anonymous Resident" },
    body: "Yes! This happened to me too. I brought it up with the management office directly and they said they'd talk to her.",
    upvotes: 8,
    downvotes: 0,
    myVote: 0,
    createdAt: hoursAgo(10),
  },
  {
    id: "c-2",
    postId: "post-2",
    parentCommentId: "c-1",
    author: { isAnonymous: false, displayName: "Divya R." },
    body: "Good to know, thank you for flagging this. Did it actually stop after you spoke to them?",
    upvotes: 3,
    downvotes: 0,
    myVote: 0,
    createdAt: hoursAgo(9),
  },
  {
    id: "c-3",
    postId: "post-2",
    parentCommentId: null,
    author: { isAnonymous: true, anonymousTag: "Anonymous Resident" },
    body: "Worth reporting through the app too so it's on record, not just word of mouth.",
    upvotes: 12,
    downvotes: 0,
    myVote: 0,
    createdAt: hoursAgo(8),
  },
];

const notifications: AppNotification[] = [
  {
    id: "n-1",
    type: "reply",
    pgId: "pg-1",
    pgName: "Sunrise Ladies PG",
    postId: "post-2",
    postExcerpt: "Good to know, thank you for flagging this...",
    wasAnonymous: true,
    isRead: false,
    createdAt: hoursAgo(9),
  },
  {
    id: "n-2",
    type: "upvote",
    pgId: "pg-2",
    pgName: "Green Nest Women's Hostel",
    postId: "post-3",
    postExcerpt: "Would you want a shared kitchen slot booking system?",
    wasAnonymous: false,
    isRead: true,
    createdAt: hoursAgo(28),
  },
];

const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));

export async function fetchDiscoverFeed(area?: ChennaiArea | "All") {
  await delay();
  const filtered = area && area !== "All" ? pgs.filter((p) => p.area === area) : pgs;
  return filtered.filter((p) => p.isPubliclyVisible).sort((a, b) => b.reviewCount - a.reviewCount);
}

export async function searchPgs(query: string) {
  await delay(150);
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return pgs.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q)
  );
}

export async function fetchPg(id: string) {
  await delay();
  return pgs.find((p) => p.id === id) ?? null;
}

export async function fetchPgsByIds(ids: string[]) {
  await delay();
  return ids.map((id) => pgs.find((p) => p.id === id)).filter((p): p is Pg => p != null);
}

export async function fetchPostsForPg(pgId: string, sort: "new" | "top" | "discussed" = "new") {
  await delay();
  const list = posts.filter((p) => p.pgId === pgId);
  if (sort === "top") return [...list].sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
  if (sort === "discussed") return [...list].sort((a, b) => b.commentCount - a.commentCount);
  return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function fetchPost(postId: string) {
  await delay();
  return posts.find((p) => p.id === postId) ?? null;
}

export async function fetchCommentsForPost(postId: string) {
  await delay();
  return comments.filter((c) => c.postId === postId);
}

export interface FeedPost extends Post {
  pgName: string;
  pgArea: ChennaiArea;
  topComment: Comment | null;
  /** Display-only: this post is shown under its area's cross-PG community rather than one PG's page. */
  isCommunityPost: boolean;
}

// Posts shown under an area-wide "community" header instead of a single PG's — still
// belongs to a real pgId underneath (routing/comments are unaffected), this only changes
// how the feed card's header renders. Demo set; a real area-community model is future scope.
const COMMUNITY_POST_IDS = new Set(["post-6"]);

/** Cross-PG activity feed for Home — mixes posts from joined + trending public PGs. */
export async function fetchHomeFeed(area?: ChennaiArea | "All"): Promise<FeedPost[]> {
  await delay();
  return [...posts]
    .filter((p) => pgs.find((pg) => pg.id === p.pgId)?.isPubliclyVisible)
    .filter((p) => {
      if (!area || area === "All") return true;
      return pgs.find((pg) => pg.id === p.pgId)?.area === area;
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((post) => {
      const pg = pgs.find((p) => p.id === post.pgId)!;
      const postComments = comments
        .filter((c) => c.postId === post.id && c.parentCommentId === null)
        .sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
      return {
        ...post,
        pgName: pg.name,
        pgArea: pg.area,
        topComment: postComments[0] ?? null,
        isCommunityPost: COMMUNITY_POST_IDS.has(post.id),
      };
    });
}

export interface TrendingDiscussion {
  postId: string;
  pgId: string;
  title: string;
  replyCount: number;
  lastActivityAt: string;
}

export async function fetchTrendingDiscussions(): Promise<TrendingDiscussion[]> {
  await delay(150);
  return [...posts]
    .filter((p) => pgs.find((pg) => pg.id === p.pgId)?.isPubliclyVisible)
    .sort((a, b) => b.commentCount - a.commentCount)
    .slice(0, 4)
    .map((p) => ({ postId: p.id, pgId: p.pgId, title: p.title, replyCount: p.commentCount, lastActivityAt: p.createdAt }));
}

export async function fetchNearbyPgs(excludeJoinedIds: string[] = []) {
  await delay(150);
  return pgs
    .filter((p) => p.isPubliclyVisible && !excludeJoinedIds.includes(p.id))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function fetchSuggestedPgs(excludeJoinedIds: string[] = []) {
  await delay();
  return pgs
    .filter((p) => p.isPubliclyVisible && !excludeJoinedIds.includes(p.id))
    .sort((a, b) => b.memberCount - a.memberCount);
}

export async function fetchJoinedPgs() {
  await delay();
  return pgs.filter((p) => currentUser.joinedPgIds.includes(p.id));
}

export async function joinPg(pgId: string) {
  await delay(200);
  if (!currentUser.joinedPgIds.includes(pgId)) {
    currentUser.joinedPgIds.push(pgId);
    const pg = pgs.find((p) => p.id === pgId);
    if (pg) pg.memberCount += 1;
  }
  return currentUser;
}

export async function fetchNotifications() {
  await delay();
  return [...notifications].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function fetchProfile() {
  await delay();
  return currentUser;
}

export async function createPg(input: { name: string; area: ChennaiArea; address?: string }) {
  await delay(300);
  const pg: Pg = {
    id: `pg-${pgs.length + 1}`,
    name: input.name,
    area: input.area,
    address: input.address,
    memberCount: 1,
    reviewCount: 0,
    aggregateRating: null,
    tagAverages: {},
    isPubliclyVisible: false,
    createdAt: new Date().toISOString(),
  };
  pgs.push(pg);
  return pg;
}

export async function createPost(input: Omit<Post, "id" | "upvotes" | "downvotes" | "myVote" | "commentCount" | "isSaved" | "createdAt" | "myPollVote">) {
  await delay(300);
  const post: Post = {
    ...input,
    id: `post-${posts.length + 1}`,
    upvotes: 0,
    downvotes: 0,
    myVote: 0,
    commentCount: 0,
    isSaved: false,
    myPollVote: input.type === "poll" ? null : undefined,
    createdAt: new Date().toISOString(),
  };
  posts.unshift(post);
  const pg = pgs.find((p) => p.id === input.pgId);
  if (pg) {
    pg.reviewCount += input.type === "review" ? 1 : 0;
  }
  return post;
}

export async function createComment(input: { postId: string; parentCommentId: string | null; body: string; author: Comment["author"] }) {
  await delay(250);
  const comment: Comment = {
    id: `c-${comments.length + 1}`,
    postId: input.postId,
    parentCommentId: input.parentCommentId,
    author: input.author,
    body: input.body,
    upvotes: 0,
    downvotes: 0,
    myVote: 0,
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  const post = posts.find((p) => p.id === input.postId);
  if (post) post.commentCount += 1;
  return comment;
}

export async function votePost(postId: string, direction: 1 | -1 | 0) {
  await delay(120);
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post not found");
  if (post.myVote === 1) post.upvotes -= 1;
  if (post.myVote === -1) post.downvotes -= 1;
  if (direction === 1) post.upvotes += 1;
  if (direction === -1) post.downvotes += 1;
  post.myVote = direction;
  return post;
}

export async function votePollOption(postId: string, optionId: string) {
  await delay(120);
  const post = posts.find((p) => p.id === postId);
  if (!post || !post.pollOptions) throw new Error("Post not found");
  if (post.myPollVote) return post; // one vote per poll, already cast
  const option = post.pollOptions.find((o) => o.id === optionId);
  if (!option) throw new Error("Option not found");
  option.voteCount += 1;
  post.myPollVote = optionId;
  return post;
}

export async function toggleSavePost(postId: string) {
  await delay(120);
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post not found");
  post.isSaved = !post.isSaved;
  return post;
}

export async function reportContent(input: { targetType: "post" | "comment"; targetId: string; reason: string; detail?: string }) {
  await delay(300);
  return { ok: true, ...input };
}
