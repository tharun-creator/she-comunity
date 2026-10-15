"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MapPin, MessageCircle, Search, Sparkles, UsersRound } from "lucide-react";
import { AppShell } from "@/components/shestays/app-shell";
import { FeedPostCard } from "@/components/shestays/feed-post-card";
import { InlineComposer } from "@/components/shestays/inline-composer";
import { FilterPillBar } from "@/components/shestays/filter-pill-bar";
import { TrendingDiscussionsPanel } from "@/components/shestays/trending-discussions-panel";
import { SuggestedPgsPanel } from "@/components/shestays/suggested-pgs-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchHomeFeed } from "@/lib/api/adapters";
import { CHENNAI_AREAS, type ChennaiArea, type PostType } from "@/types/domain";

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
  const featuredStory = visibleFeed?.[0];

  const openComposer = () => {
    document.getElementById("story-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("story-composer-trigger")?.focus({ preventScroll: true });
  };

  return (
    <AppShell rightSidebar={<div className="space-y-4"><TrendingDiscussionsPanel /><SuggestedPgsPanel /></div>}>
      <section className="relative isolate mb-6 overflow-hidden rounded-[1.75rem] bg-primary-soft ring-1 ring-primary/10 sm:rounded-[2rem]">
        <div className="pointer-events-none absolute -right-20 -top-28 -z-10 size-72 rounded-full border border-primary/10 sm:-right-14 sm:-top-40 sm:size-[26rem]" />
        <div className="pointer-events-none absolute -right-8 -top-16 -z-10 size-48 rounded-full border border-primary/10 sm:-right-2 sm:-top-24 sm:size-72" />
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="px-5 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8 lg:py-10">
            <div className="mb-5 inline-flex min-h-9 items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3 text-xs font-semibold text-primary-hover shadow-sm">
              <MapPin className="size-3.5" />
              {areaParam ?? "Chennai"} · women helping women
            </div>
            <h1 className="max-w-[15ch] font-heading text-[2rem] font-bold leading-[1.08] tracking-[-0.04em] text-heading text-balance sm:text-4xl">
              Find a place that feels like <span className="text-primary">yours.</span>
            </h1>
            <p className="mt-3 max-w-[48ch] text-sm leading-6 text-body sm:text-base">
              Real stories from women who know the streets, the people, and what daily life is really like.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => router.push("/search")}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary-soft"
              >
                Explore communities <ArrowUpRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={openComposer}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-4 text-sm font-semibold text-heading transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Share your story <MessageCircle className="size-4 text-primary" />
              </button>
            </div>
            <div className="mt-6 flex items-center gap-4 border-t border-primary/10 pt-4 text-xs text-body sm:gap-6">
              <span className="inline-flex items-center gap-1.5"><UsersRound className="size-4 text-primary" /><strong className="tabular-nums text-heading">{feed?.length ?? "—"}</strong> stories nearby</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles className="size-4 text-primary" /><strong className="tabular-nums text-heading">{CHENNAI_AREAS.length}</strong> Chennai areas</span>
            </div>
          </div>

          <div className="relative hidden min-h-64 items-center justify-center p-6 lg:flex lg:p-8">
            <div className="absolute right-[12%] top-[12%] size-3 rounded-full bg-primary/50" />
            <div className="absolute bottom-[16%] left-[13%] size-2 rounded-full bg-primary/40" />
            <div className="absolute right-[18%] bottom-[13%] size-2 rounded-full bg-primary/30" />
            <div className="relative w-full max-w-sm rotate-[1deg] rounded-2xl border border-white/90 bg-white p-5 shadow-[0_20px_50px_-30px_rgba(107,33,61,0.45)]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary-hover">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft"><Sparkles className="size-4" /></span>
                  A note from your neighborhood
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Today</span>
              </div>
              {featuredStory ? (
                <>
                  <p className="mt-5 font-heading text-xl font-semibold leading-snug text-heading text-balance">“{featuredStory.title}”</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{featuredStory.body}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs font-medium text-body">{featuredStory.pgName}</span>
                    <span className="text-xs text-muted-foreground">{featuredStory.pgArea}</span>
                  </div>
                </>
              ) : (
                <p className="mt-5 font-heading text-xl font-semibold leading-snug text-heading">Your neighborhood stories are on their way.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => router.push("/search")}
        className="mb-4 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground shadow-[0_8px_24px_-22px_rgba(8,24,40,0.45)] transition-colors hover:border-primary/30 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Search className="size-4" /></span>
        <span className="min-w-0 flex-1 truncate">Find a PG by name, area, or what matters to you</span>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <div id="story-composer"><InlineComposer /></div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight text-heading">What neighbours are saying</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">First-hand notes from around Chennai</p>
        </div>
        <FilterPillBar options={[...POST_TYPE_OPTIONS]} value={postTypeFilter} onChange={setPostTypeFilter} />
      </div>

      <div className="space-y-4">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
        {visibleFeed?.map((post, index) => (
          <FeedPostCard key={post.id} post={post} featured={index === 0} />
        ))}
        {visibleFeed?.length === 0 && (
          <div className="rounded-[1.5rem] border border-dashed border-primary/25 bg-primary-soft/35 px-6 py-9 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-primary shadow-sm"><MessageCircle className="size-5" /></span>
            <h3 className="mt-4 font-heading text-lg font-semibold text-heading">Your neighborhood story starts here</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Find a community or share something helpful for the next woman choosing a place.</p>
            <button type="button" onClick={() => router.push("/search")} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              Find a community <ArrowUpRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
