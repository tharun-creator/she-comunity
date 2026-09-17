import { config } from "@/lib/config";
import { apiClient } from "../client";
import type { Pg } from "@/types/domain";
import type { PgListResponse } from "@/types/api";

export async function fetchDiscoverFeed(area?: string): Promise<Pg[]> {
  if (!config.useLiveApi) {
    const { fetchDiscoverFeed: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(area as any);
  }

  try {
    const params = new URLSearchParams();
    if (area && area !== "All") params.set("area", area);
    return apiClient.get<Pg[]>(`/pgs?${params.toString()}`);
  } catch {
    return [];
  }
}

export async function searchPgs(query: string): Promise<Pg[]> {
  if (!config.useLiveApi) {
    const { searchPgs: mockSearch } = await import("@/lib/mock-data");
    return mockSearch(query);
  }

  if (!query.trim()) return [];

  try {
    return apiClient.get<Pg[]>(`/pgs/search?q=${encodeURIComponent(query)}`);
  } catch {
    return [];
  }
}

export async function fetchPg(id: string): Promise<Pg | null> {
  if (!config.useLiveApi) {
    const { fetchPg: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(id);
  }

  try {
    return apiClient.get<Pg>(`/pgs/${id}`);
  } catch {
    return null;
  }
}

export async function fetchPgsByIds(ids: string[]): Promise<Pg[]> {
  if (!config.useLiveApi) {
    const { fetchPgsByIds: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(ids);
  }

  if (ids.length === 0) return [];

  try {
    // Fetch each PG individually (could be optimized with batch endpoint later)
    const results = await Promise.all(ids.map(id => apiClient.get<Pg>(`/pgs/${id}`).catch(() => null)));
    return results.filter((p): p is Pg => p !== null);
  } catch {
    return [];
  }
}

export async function fetchPostsForPg(pgId: string, sort: "new" | "top" | "discussed" = "new"): Promise<any[]> {
  if (!config.useLiveApi) {
    const { fetchPostsForPg: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(pgId, sort);
  }

  try {
    return apiClient.get<any[]>(`/pgs/${pgId}/posts?sort=${sort}`);
  } catch {
    return [];
  }
}

export async function fetchNearbyPgs(excludeJoinedIds: string[] = []): Promise<Pg[]> {
  if (!config.useLiveApi) {
    const { fetchNearbyPgs: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(excludeJoinedIds);
  }

  try {
    const params = new URLSearchParams();
    if (excludeJoinedIds.length > 0) {
      params.set("exclude", excludeJoinedIds.join(","));
    }
    return apiClient.get<Pg[]>(`/pgs/nearby?${params.toString()}`);
  } catch {
    return [];
  }
}

export async function fetchSuggestedPgs(excludeJoinedIds: string[] = []): Promise<Pg[]> {
  if (!config.useLiveApi) {
    const { fetchSuggestedPgs: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(excludeJoinedIds);
  }

  try {
    const params = new URLSearchParams();
    if (excludeJoinedIds.length > 0) {
      params.set("exclude", excludeJoinedIds.join(","));
    }
    return apiClient.get<Pg[]>(`/pgs/suggested?${params.toString()}`);
  } catch {
    return [];
  }
}

export async function fetchJoinedPgs(): Promise<Pg[]> {
  if (!config.useLiveApi) {
    const { fetchJoinedPgs: mockFetch } = await import("@/lib/mock-data");
    return mockFetch();
  }

  try {
    return apiClient.get<Pg[]>("/users/me/pgs");
  } catch {
    return [];
  }
}

export async function joinPg(pgId: string): Promise<any> {
  if (!config.useLiveApi) {
    const { joinPg: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(pgId);
  }

  try {
    return apiClient.post<any>(`/pgs/${pgId}/join`);
  } catch {
    return null;
  }
}

export async function fetchTrendingDiscussions(): Promise<any[]> {
  if (!config.useLiveApi) {
    const { fetchTrendingDiscussions: mockFetch } = await import("@/lib/mock-data");
    return mockFetch();
  }

  try {
    return apiClient.get<any[]>("/posts/trending");
  } catch {
    return [];
  }
}

export async function fetchHomeFeed(area?: string): Promise<any[]> {
  if (!config.useLiveApi) {
    const { fetchHomeFeed: mockFetch } = await import("@/lib/mock-data");
    return mockFetch(area as any);
  }

  try {
    const params = new URLSearchParams();
    if (area && area !== "All") params.set("area", area);
    return apiClient.get<any[]>(`/posts/home-feed?${params.toString()}`);
  } catch {
    return [];
  }
}

import type { ChennaiArea } from "@/types/domain";

export async function createPg(input: { name: string; area: ChennaiArea; address?: string }): Promise<any> {
  if (!config.useLiveApi) {
    const { createPg: mockCreate } = await import("@/lib/mock-data");
    return mockCreate(input);
  }

  try {
    return apiClient.post<any>("/pgs", input);
  } catch {
    return null;
  }
}