import { config } from "@/lib/config";
import { apiClient } from "../client";
import type { UserProfile } from "@/types/domain";

export async function fetchProfile(): Promise<UserProfile | null> {
  if (!config.useLiveApi) {
    const { fetchProfile: mockFetchProfile } = await import("@/lib/mock-data");
    return mockFetchProfile();
  }

  try {
    return apiClient.get<UserProfile>("/users/me");
  } catch {
    return null;
  }
}

export async function refreshProfile(): Promise<UserProfile | null> {
  if (!config.useLiveApi) {
    const { fetchProfile: mockFetchProfile } = await import("@/lib/mock-data");
    return mockFetchProfile();
  }

  try {
    return apiClient.get<UserProfile>("/users/me");
  } catch {
    return null;
  }
}

export async function attestWoman(): Promise<UserProfile | null> {
  if (!config.useLiveApi) {
    const { fetchProfile: mockFetchProfile } = await import("@/lib/mock-data");
    return mockFetchProfile();
  }

  try {
    return apiClient.patch<UserProfile>("/users/me/attest", { attested: true });
  } catch {
    return null;
  }
}