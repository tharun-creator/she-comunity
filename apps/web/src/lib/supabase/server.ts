import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side client for Server Components / Route Handlers. Still uses the
// anon key (never the service role key — that belongs only in apps/api,
// server-side, and must never reach this package). Requests run as the
// signed-in user's session, so RLS still applies exactly as it does for the
// browser client.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component during render — safe to ignore
            // as long as middleware also refreshes the session.
          }
        },
      },
    }
  );
}
