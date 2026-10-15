import { config } from "@/lib/config";
import { apiClient } from "../client";
import type { Pg, Post } from "@/types/domain";
import type { FeedPost } from "@/lib/mock-data";
import type { ChennaiArea } from "@/types/domain";

export async function fetchDiscoverFeed(area?: string): Promise<Pg[]> {
  if (!config.useLiveApi) {
    const { fetchDiscoverFeed: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(area as ChennaiArea | "All" | undefined);
  }

  const params = new URLSearchParams();
  if (area && area !== "All") params.set("area", area);
  return apiClient.get<Pg[]>(`/pgs?${params.toString()}`);
}

export async function searchPgs(query: string): Promise<Pg[]> {
  if (!config.useLiveApi) {
    const { searchPgs: mockSearch } = await import("@/lib/mock-data");
    return mockSearch(query);
  }

  if (!query.trim()) return [];

  return apiClient.get<Pg[]>(`/pgs/search?q=${encodeURIComponent(query)}`);
}

export async function fetchPg(id: string): Promise<Pg | null> {
  if (!config.useLiveApi) {
    const { fetchPg: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(id);
  }

  return apiClient.get<Pg>(`/pgs/${id}`);
}

export async function fetchPgsByIds(ids: string[]): Promise<Pg[]> {
  if (!config.useLiveApi) {
    const { fetchPgsByIds: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(ids);
  }

  if (ids.length === 0) return [];

  // Fetch each PG individually (could be optimized with batch endpoint later).
  return Promise.all(ids.map(id => apiClient.get<Pg>(`/pgs/${id}`)));
}

export async function fetchPostsForPg(pgId: string, sort: "new" | "top" | "discussed" = "new"): Promise<Post[]> {
  if (!config.useLiveApi) {
    const { fetchPostsForPg: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(pgId, sort);
  }

  return apiClient.get<Post[]>(`/pgs/${pgId}/posts?sort=${sort}`);
}

export async function fetchNearbyPgs(excludeJoinedIds: string[] = []): Promise<Pg[]> {
  if (!config.useLiveApi) {
    const { fetchNearbyPgs: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(excludeJoinedIds);
  }

  const params = new URLSearchParams();
  if (excludeJoinedIds.length > 0) {
    params.set("exclude", excludeJoinedIds.join(","));
  }
  return apiClient.get<Pg[]>(`/pgs/nearby?${params.toString()}`);
}

export async function fetchSuggestedPgs(excludeJoinedIds: string[] = []): Promise<Pg[]> {
  if (!config.useLiveApi) {
    const { fetchSuggestedPgs: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(excludeJoinedIds);
  }

  const params = new URLSearchParams();
  if (excludeJoinedIds.length > 0) {
    params.set("exclude", excludeJoinedIds.join(","));
  }
  return apiClient.get<Pg[]>(`/pgs/suggested?${params.toString()}`);
}

export async function fetchJoinedPgs(): Promise<Pg[]> {
  if (!config.useLiveApi) {
    const { fetchJoinedPgs: mockFetch } = await import("@/lib/mock-data");
    return mockFetch();
  }

  return apiClient.get<Pg[]>("/users/me/pgs");
}

export async function joinPg(pgId: string): Promise<{ pg_id: string; pg_name: string; area: string; joined_at: string } | null> {
  if (!config.useLiveApi) {
    const { joinPg: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(pgId) as unknown as Promise<{ pg_id: string; pg_name: string; area: string; joined_at: string } | null>;
  }

  return apiClient.post<{ pg_id: string; pg_name: string; area: string; joined_at: string }>(`/pgs/${pgId}/join`);
}

export async function fetchTrendingDiscussions(): Promise<Post[]> {
  if (!config.useLiveApi) {
    const { fetchTrendingDiscussions: mockFetch } = await import("@/lib/mock-data");
    return mockFetch() as unknown as Promise<Post[]>;
  }

  return apiClient.get<Post[]>("/posts/trending");
}

export async function fetchHomeFeed(area?: string): Promise<FeedPost[]> {
  if (!config.useLiveApi) {
    const { fetchHomeFeed: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(area as ChennaiArea | "All" | undefined);
  }

  const params = new URLSearchParams();
  if (area && area !== "All") params.set("area", area);
  const posts = await apiClient.get<Post[]>(`/posts/home-feed?${params.toString()}`);
  const pgIds = [...new Set(posts.map((post) => post.pgId))];
  const pgs = await fetchPgsByIds(pgIds);
  const pgById = new Map(pgs.map((pg) => [pg.id, pg]));

  return posts.map((post) => {
    const pg = pgById.get(post.pgId);
    if (!pg) throw new Error(`Missing community details for post ${post.id}`);
    return {
      ...post,
      pgName: pg.name,
      pgArea: pg.area,
      topComment: null,
      isCommunityPost: false,
    };
  });
}

export async function createPg(input: { name: string; area: ChennaiArea; address?: string }): Promise<Pg | null> {
  if (!config.useLiveApi) {
    const { createPg: mockCreate } = await import("@/lib/mock-data");
    return mockCreate(input);
  }

  return apiClient.post<Pg>("/pgs", input);
}
