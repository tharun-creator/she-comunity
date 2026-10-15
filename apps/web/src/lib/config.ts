export const config = {
  useLiveApi: process.env.NEXT_PUBLIC_USE_LIVE_API === "true",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1",
} as const;

export type Config = typeof config;
