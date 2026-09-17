import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createPostSchema = z.object({
  type: z.enum(["review", "discussion", "poll"]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  isAnonymous: z.boolean().default(false),
  residencyClaim: z.enum(["stayed_here", "currently_here"]).optional(),
  ratingTags: z.record(z.string(), z.number().min(1).max(5)).optional(),
  overallRating: z.number().min(1).max(5).optional(),
  pollOptions: z.array(z.object({ label: z.string().min(1).max(100) })).min(2).max(5).optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  topics: z.array(z.string().min(1).max(50)).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "new";
  const limit = parseInt(searchParams.get("limit") || "20");
  const cursor = searchParams.get("cursor");

  let query = supabase
    .from("posts_public")
    .select("*")
    .eq("pg_id", id)
    .limit(limit);

  if (sort === "top") {
    query = query.order("upvotes", { ascending: false });
  } else if (sort === "discussed") {
    query = query.order("comment_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(posts);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check membership
  const { data: membership } = await supabase
    .from("pg_memberships")
    .select("id")
    .eq("pg_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Must be a member to post" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = createPostSchema.parse(body);

    const author = validated.isAnonymous
      ? { is_anonymous: true, anonymous_tag: "Anonymous Resident" }
      : { is_anonymous: false, display_name: (await supabase.from("users").select("display_name").eq("auth_user_id", user.id).single()).data?.display_name };

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        pg_id: id,
        author_id: user.id,
        is_anonymous: validated.isAnonymous,
        type: validated.type,
        title: validated.title,
        body: validated.body,
        residency_claim: validated.residencyClaim,
        rating_tags: validated.ratingTags,
        overall_rating: validated.overallRating,
        poll_options: validated.pollOptions?.map((o, i) => ({ id: `opt-${i}`, label: o.label, vote_count: 0 })),
        image_url: validated.imageUrl,
        link_url: validated.linkUrl,
        topics: validated.topics,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}