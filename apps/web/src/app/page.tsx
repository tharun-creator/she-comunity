"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppShell } from "@/components/shestays/app-shell";
import { FeedPostCard } from "@/components/shestays/feed-post-card";
import { FilterPillBar } from "@/components/shestays/filter-pill-bar";
import { TrendingDiscussionsPanel } from "@/components/shestays/trending-discussions-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchHomeFeed } from "@/lib/mock-data";
import { type ChennaiArea, type PostType } from "@/types/domain";

const POST_TYPE_OPTIONS = ["All", "Reviews", "Discussions", "Polls"] as const;
type PostTypeFilter = (typeof POST_TYPE_OPTIONS)[number];

const POST_TYPE_MAP: Record<Exclude<PostTypeFilter, "All">, PostType> = {
  Reviews: "review",
  Discussions: "discussion",
  Polls: "poll",
};

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeFeed />
    </Suspense>
  );
}

function HomeFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const areaParam = searchParams.get("area") as ChennaiArea | null;
  const [postTypeFilter, setPostTypeFilter] = useState<PostTypeFilter>("All");

  const { data: feed, isLoading } = useQuery({
    queryKey: ["home-feed", areaParam],
    queryFn: () => fetchHomeFeed(areaParam ?? "All"),
  });

  const visibleFeed = feed?.filter(
    (post) => postTypeFilter === "All" || post.type === POST_TYPE_MAP[postTypeFilter]
  );

  return (
    <AppShell rightSidebar={<TrendingDiscussionsPanel />}>
      <button
        type="button"
        onClick={() => router.push("/search")}
        className="mb-3 flex w-full items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
      >
        <Search className="size-4" />
        Search PGs, communities, or conversations…
      </button>

      <div className="mb-4">
        <FilterPillBar options={[...POST_TYPE_OPTIONS]} value={postTypeFilter} onChange={setPostTypeFilter} />
      </div>

      <div className="space-y-4">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        {visibleFeed?.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
        {visibleFeed?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nothing here yet — be the first to post from a PG&apos;s place page.
          </p>
        )}
      </div>
    </AppShell>
  );
}
