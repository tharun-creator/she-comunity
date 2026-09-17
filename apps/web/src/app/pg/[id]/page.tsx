"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Star, Users, MapPin, PenSquare } from "lucide-react";
import { AppShell } from "@/components/shestays/app-shell";
import { PostCard } from "@/components/shestays/post-card";
import { RatingTagChip } from "@/components/shestays/rating-tag-chip";
import { FilterPillBar } from "@/components/shestays/filter-pill-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPg, fetchPostsForPg } from "@/lib/api/adapters";
import type { RatingTag } from "@/types/domain";

const SORTS = ["New", "Top", "Most discussed"] as const;
type Sort = (typeof SORTS)[number];
const sortKey: Record<Sort, "new" | "top" | "discussed"> = {
  New: "new",
  Top: "top",
  "Most discussed": "discussed",
};

export default function PgPlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sort, setSort] = useState<Sort>("New");

  const { data: pg, isLoading: pgLoading } = useQuery({ queryKey: ["pg", id], queryFn: () => fetchPg(id) });
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["posts", id, sortKey[sort]],
    queryFn: () => fetchPostsForPg(id, sortKey[sort]),
  });

  if (pgLoading) {
    return (
      <AppShell>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </AppShell>
    );
  }

  if (!pg) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">This PG page doesn&apos;t exist.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      rightSidebar={
        <div className="space-y-4">
          <h2 className="font-heading text-sm font-semibold text-heading">PG stats</h2>
          <div className="space-y-2">
            {Object.entries(pg.tagAverages).map(([tag, value]) => (
              <div key={tag} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{tag}</span>
                <span className="inline-flex items-center gap-1 font-medium text-heading">
                  <Star className="size-3.5 fill-warning text-warning" />
                  {(value ?? 0).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-primary-soft p-3 text-xs text-primary-hover">
            Reminder: no doxxing of individuals by full name, and unverifiable claims should be
            framed as your experience, not fact.
          </div>
        </div>
      }
    >
      <div className="mb-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl font-bold text-heading">{pg.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {pg.area}
              {pg.address ? ` · ${pg.address}` : ""}
            </p>
          </div>
          {pg.aggregateRating != null && (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-base font-semibold text-primary-hover">
              <Star className="size-4 fill-current" />
              {pg.aggregateRating.toFixed(1)}
            </div>
          )}
        </div>

        {Object.keys(pg.tagAverages).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(pg.tagAverages).map(([tag, value]) => (
              <RatingTagChip key={tag} tag={tag as RatingTag} value={value ?? 0} />
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" />
            {pg.memberCount} members · {pg.reviewCount} reviews
          </span>
          <Link href={`/pg/${pg.id}/compose`} className="hidden sm:block">
            <Button size="sm" className="gap-1.5">
              <PenSquare className="size-3.5" />
              Write a review
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-3">
        <FilterPillBar options={SORTS as unknown as Sort[]} value={sort} onChange={setSort} />
      </div>

      <div className="space-y-3">
        {postsLoading &&
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} pgId={pg.id} />
        ))}
        {posts?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No posts yet — start the conversation.
          </p>
        )}
      </div>

      {/* Mobile sticky compose FAB */}
      <Link
        href={`/pg/${pg.id}/compose`}
        className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg sm:hidden"
        aria-label="Write a review"
      >
        <PenSquare className="size-5" />
      </Link>
    </AppShell>
  );
}
