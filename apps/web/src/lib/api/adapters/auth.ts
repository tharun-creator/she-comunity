import { config } from "@/lib/config";
import { createBrowserClient } from "@supabase/ssr";
import { apiClient } from "../client";
import type { UserProfile } from "@/types/domain";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchProfile(): Promise<UserProfile | null> {
  if (!config.useLiveApi) {
    const { fetchProfile: mockFetchProfile } = await import("@/lib/mock-data");
    return mockFetchProfile();
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return apiClient.get<UserProfile>(`/profile/${user.id}`);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return apiClient.get<UserProfile>(`/profile/${user.id}`);
  } catch {
    return null;
  }
}