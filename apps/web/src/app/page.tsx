"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppShell } from "@/components/shestays/app-shell";
import { FeedPostCard } from "@/components/shestays/feed-post-card";
import { FilterPillBar } from "@/components/shestays/filter-pill-bar";
import { InlineComposer } from "@/components/shestays/inline-composer";
import { SuggestedPgsPanel } from "@/components/shestays/suggested-pgs-panel";
import { TrendingDiscussionsPanel } from "@/components/shestays/trending-discussions-panel";
import { NearbyPgsPanel } from "@/components/shestays/nearby-pgs-panel";
import { CommunityScroller } from "@/components/shestays/community-scroller";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchHomeFeed, fetchJoinedPgs } from "@/lib/mock-data";
import { CHENNAI_AREAS, type ChennaiArea } from "@/types/domain";

const AREA_OPTIONS: (ChennaiArea | "All")[] = ["All", ...CHENNAI_AREAS];

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
  const area: (typeof AREA_OPTIONS)[number] = areaParam && CHENNAI_AREAS.includes(areaParam) ? areaParam : "All";

  const setArea = (next: (typeof AREA_OPTIONS)[number]) => {
    router.push(next === "All" ? "/" : `/?area=${encodeURIComponent(next)}`);
  };

  const { data: feed, isLoading } = useQuery({
    queryKey: ["home-feed", area],
    queryFn: () => fetchHomeFeed(area),
  });
  const { data: joined } = useQuery({ queryKey: ["joined-pgs"], queryFn: fetchJoinedPgs });

  return (
    <AppShell
      rightSidebar={
        <div className="space-y-4">
          <SuggestedPgsPanel />
          <TrendingDiscussionsPanel />
          <NearbyPgsPanel />
        </div>
      }
    >
      <button
        type="button"
        onClick={() => router.push("/search")}
        className="mb-3 flex w-full items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
      >
        <Search className="size-4" />
        Search PGs, communities, or conversations…
      </button>

      <CommunityScroller />

      {joined && joined.length < 2 && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 lg:hidden">
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold text-heading">Your community is waiting</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Join your PG&apos;s community to see honest, anonymous-friendly reviews from people who live there.
            </p>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => router.push("/search")}>
            Find it
          </Button>
        </div>
      )}

      <div className="mb-4">
        <FilterPillBar options={AREA_OPTIONS} value={area} onChange={setArea} />
      </div>

      <InlineComposer />

      <div className="space-y-4">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        {feed?.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
        {feed?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No activity in this area yet — be the first to post from a PG&apos;s place page.
          </p>
        )}
      </div>
    </AppShell>
  );
}
