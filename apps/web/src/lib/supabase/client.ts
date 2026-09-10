import { createBrowserClient } from "@supabase/ssr";

// Browser-side client. Uses only the public URL + anon key — safe to ship to
// the client bundle. Every table it can touch is gated by RLS (see
// docs/rls-policies.sql); this key can never bypass that.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
