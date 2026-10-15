import { config } from "../config";
import { createClient } from "../supabase/client";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const normalizedBase = this.baseUrl.replace(/\/+$/, "");
    const normalizedPath = path.replace(/^\/+/, "");
    const url = `${normalizedBase}/${normalizedPath}`;

    if (!params || Object.keys(params).length === 0) return url;

    const query = new URLSearchParams(params);
    return `${url}${url.includes("?") ? "&" : "?"}${query.toString()}`;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);

    const requestHeaders = new Headers(headers);
    if (!requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const { data: { session } } = await createClient().auth.getSession();
    if (session?.access_token) {
      requestHeaders.set("Authorization", `Bearer ${session.access_token}`);
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      const message = error?.error?.message || error?.message || `HTTP ${response.status}`;
      throw new Error(`${message} (HTTP ${response.status})`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  get<T>(path: string, params?: Record<string, string>) {
    return this.request<T>(path, { method: "GET", params });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
