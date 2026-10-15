import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./client";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock("../supabase/client", () => ({
  createClient: () => ({ auth: { getSession } }),
}));

describe("API client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "test-access-token" } },
    });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("sends same-origin API requests with the Supabase bearer token", async () => {
    await expect(apiClient.get("/pgs", { area: "OMR-Sholinganallur" })).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/pgs?area=OMR-Sholinganallur");
    expect(new Headers(request.headers).get("Authorization")).toBe("Bearer test-access-token");
    expect(request.credentials).toBe("include");
  });

  it("surfaces the backend message for unauthorized requests", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Missing authorization header" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(apiClient.get("/users/me")).rejects.toThrow("Missing authorization header (HTTP 401)");
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(request.headers).has("Authorization")).toBe(false);
  });
});
