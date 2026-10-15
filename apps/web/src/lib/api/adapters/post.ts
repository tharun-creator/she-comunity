import { config } from "@/lib/config";
import { apiClient } from "../client";
import type { Post, Comment } from "@/types/domain";

export async function fetchPost(postId: string): Promise<Post | null> {
  if (!config.useLiveApi) {
    const { fetchPost: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(postId);
  }

  return apiClient.get<Post>(`/posts/${postId}`);
}

export async function fetchCommentsForPost(postId: string): Promise<Comment[]> {
  if (!config.useLiveApi) {
    const { fetchCommentsForPost: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(postId);
  }

  return apiClient.get<Comment[]>(`/posts/${postId}/comments`);
}

export async function createPost(input: { pgId: string; type: "review" | "discussion" | "poll"; title: string; body: string; isAnonymous: boolean; residencyClaim?: "stayed_here" | "currently_here"; ratingTags?: Record<string, number>; overallRating?: number; pollOptions?: { label: string }[]; imageUrl?: string; linkUrl?: string; topics?: string[] }): Promise<Post | null> {
  if (!config.useLiveApi) {
    const { createPost: mockCreate } = await import("@/lib/mock-data");
    return mockCreate(input);
  }

  return apiClient.post<Post>(`/pgs/${input.pgId}/posts`, input);
}

export async function createComment(input: { postId: string; parentCommentId: string | null; body: string; author: Comment["author"] }): Promise<Comment | null> {
  if (!config.useLiveApi) {
    const { createComment: mockCreate } = await import("@/lib/mock-data");
    return mockCreate(input);
  }

  return apiClient.post<Comment>(`/posts/${input.postId}/comments`, {
    body: input.body,
    is_anonymous: input.author.isAnonymous,
    parent_comment_id: input.parentCommentId,
  });
}

export async function votePost(postId: string, direction: 1 | -1 | 0): Promise<unknown> {
  if (!config.useLiveApi) {
    const { votePost: mockVote } = await import("@/lib/mock-data");
    return mockVote(postId, direction);
  }

  return apiClient.post<unknown>(`/posts/${postId}/vote`, { direction });
}

export async function votePollOption(postId: string, optionId: string): Promise<unknown> {
  if (!config.useLiveApi) {
    const { votePollOption: mockVote } = await import("@/lib/mock-data");
    return mockVote(postId, optionId);
  }

  return apiClient.post<unknown>(`/posts/${postId}/poll/vote`, { option_id: optionId });
}

export async function toggleSavePost(postId: string): Promise<Post> {
  if (!config.useLiveApi) {
    const { toggleSavePost: mockToggle } = await import("@/lib/mock-data");
    return mockToggle(postId);
  }

  return apiClient.post<Post>(`/posts/${postId}/save`);
}

export async function reportContent(input: { targetType: "post" | "comment"; targetId: string; reason: string; detail?: string }): Promise<unknown> {
  if (!config.useLiveApi) {
    const { reportContent: mockReport } = await import("@/lib/mock-data");
    return mockReport(input);
  }

  return apiClient.post<unknown>("/reports", input);
}
