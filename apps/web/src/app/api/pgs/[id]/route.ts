import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pg, error } = await supabase
    .from("pgs")
    .select(`
      *,
      pg_stats!inner (
        member_count,
        review_count,
        aggregate_rating
      )
    `)
    .eq("id", id)
    .single();

  if (error || !pg) {
    return NextResponse.json({ error: "PG not found" }, { status: 404 });
  }

  // Check visibility
  const { data: membership } = await supabase
    .from("pg_memberships")
    .select("id")
    .eq("pg_id", id)
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
    .single();

  const isMember = !!membership;
  const isPublic = pg.member_count >= 3 || pg.review_count >= 5;

  if (!isMember && !isPublic) {
    return NextResponse.json({ error: "PG not found" }, { status: 404 });
  }

  return NextResponse.json(pg);
}