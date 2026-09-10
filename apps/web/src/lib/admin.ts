// Hardcoded allowlist standing in for a real admin role. There is no login
// system in this app yet — currentUser (mock-data.ts) is the only "session"
// that exists — so this is a UI-only gate, not a security boundary. It
// documents the mechanism a real is_admin flag + Supabase Auth check should
// replace once auth exists (see README.md and
// docs/superpowers/specs/2026-09-10-admin-panel-design.md).
export const ADMIN_USER_IDS: string[] = ["u-me"];

export function isAdmin(userId: string | undefined): boolean {
  return !!userId && ADMIN_USER_IDS.includes(userId);
}
