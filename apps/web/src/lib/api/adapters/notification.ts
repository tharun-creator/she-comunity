import { config } from "@/lib/config";
import { apiClient } from "../client";
import type { AppNotification } from "@/types/domain";

export async function fetchNotifications(): Promise<AppNotification[]> {
  if (!config.useLiveApi) {
    const { fetchNotifications: mockFetch } = await import("@/lib/mock-data");
    return mockFetch();
  }

  return apiClient.get<AppNotification[]>("/notifications");
}
