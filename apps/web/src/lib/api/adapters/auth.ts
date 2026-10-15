import { config } from "@/lib/config";
import { apiClient } from "../client";
import type { UserProfile } from "@/types/domain";

export async function fetchProfile(): Promise<UserProfile | null> {
  if (!config.useLiveApi) {
    const { fetchProfile: mockFetchProfile } = await import("@/lib/mock-data");
    return mockFetchProfile();
  }

  return apiClient.get<UserProfile>("/users/me");
}

export async function refreshProfile(): Promise<UserProfile | null> {
  if (!config.useLiveApi) {
    const { fetchProfile: mockFetchProfile } = await import("@/lib/mock-data");
    return mockFetchProfile();
  }

  return apiClient.get<UserProfile>("/users/me");
}

export async function attestWoman(): Promise<UserProfile | null> {
  if (!config.useLiveApi) {
    const { fetchProfile: mockFetchProfile } = await import("@/lib/mock-data");
    return mockFetchProfile();
  }

  return apiClient.patch<UserProfile>("/users/me/attest", { attested: true });
}

export async function updateProfileAvatar(avatarUrl: string): Promise<UserProfile | null> {
  if (!config.useLiveApi) {
    const { updateProfileAvatar: mockUpdate } = await import("@/lib/mock-data");
    return mockUpdate(avatarUrl);
  }

  return apiClient.patch<UserProfile>("/users/me", { avatar_url: avatarUrl });
}
