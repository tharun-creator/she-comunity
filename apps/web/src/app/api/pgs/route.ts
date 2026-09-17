import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createPgSchema = z.object({
  name: z.string().min(1).max(100),
  area: z.enum(["OMR-Sholinganallur", "Thoraipakkam", "Nungambakkam", "Velachery", "Anna Nagar"]),
  address: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, area, address } = createPgSchema.parse(body);

    const { data: pg, error } = await supabase
      .from("pgs")
      .insert({
        name,
        area,
        address,
        founding_user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create membership for founder
    await supabase.from("pg_memberships").insert({
      pg_id: pg.id,
      user_id: user.id,
    });

    return NextResponse.json(pg, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const area = searchParams.get("area");
  const limit = parseInt(searchParams.get("limit") || "20");
  const cursor = searchParams.get("cursor");

  let query = supabase
    .from("pgs")
    .select(`
      *,
      pg_stats!inner (
        member_count,
        review_count,
        aggregate_rating
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (search) {
    query = query.or(`name.ilike.%${search}%,area.ilike.%${search}%`);
  }

  if (area && area !== "All") {
    query = query.eq("area", area);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: pgs, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(pgs);
}