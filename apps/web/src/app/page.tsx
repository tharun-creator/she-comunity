"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MapPin, MessageCircle, Search, Sparkles, UsersRound, ShieldCheck } from "lucide-react";
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
      {/* Neubrutalism Hero Banner */}
      <section className="relative mb-6 overflow-hidden rounded-2xl border-[2.5px] border-black bg-[#FFE5EC] shadow-[5px_5px_0px_#000]">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[#FFD23F] px-3 py-1 text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_#000]">
              <MapPin className="size-3.5 fill-black text-black" />
              {areaParam ?? "Chennai"} · Women Community First
            </div>
            
            <h1 className="font-heading text-3xl font-black leading-tight tracking-tight text-black sm:text-4xl lg:text-5xl">
              Find a place that feels like <span className="bg-[#FF4B72] px-2 py-0.5 text-white rounded-lg">yours.</span>
            </h1>
            
            <p className="mt-3 max-w-md text-sm font-bold text-gray-700 sm:text-base">
              Real, unfiltered stories from women who lived there. Check safety ratings, warden rules, and real food quality.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/search")}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#FF4B72] px-5 py-2.5 text-sm font-black text-white shadow-[3px_3px_0px_#000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
              >
                Find PGs & Hostels <ArrowUpRight className="size-4.5 stroke-[2.5]" />
              </button>
              
              <button
                type="button"
                onClick={openComposer}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-5 py-2.5 text-sm font-black text-black shadow-[3px_3px_0px_#000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
              >
                Write A Review <MessageCircle className="size-4 text-[#FF4B72]" />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-4 border-t-2 border-black/10 pt-4 text-xs font-bold text-black sm:gap-6">
              <span className="inline-flex items-center gap-1.5">
                <UsersRound className="size-4 text-[#FF4B72]" />
                <strong>{feed?.length ?? "—"}</strong> stories nearby
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-[#05D5A4]" />
                <strong>{CHENNAI_AREAS.length}</strong> Chennai areas covered
              </span>
            </div>
          </div>

          {/* Right Sticker Feature Card */}
          <div className="relative hidden items-center justify-center p-6 lg:flex">
            <div className="w-full max-w-sm rotate-1 rounded-2xl border-[2.5px] border-black bg-white p-5 shadow-[4px_4px_0px_#000]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-black bg-[#FFD23F] px-2 py-0.5 text-xs font-black text-black">
                  <Sparkles className="size-3.5 fill-black" />
                  Resident Spotlight
                </span>
                <span className="rounded-md border border-black bg-gray-100 px-2 py-0.5 text-[10px] font-black text-black">
                  Recent
                </span>
              </div>
              
              {featuredStory ? (
                <>
                  <p className="mt-4 font-heading text-lg font-black leading-snug text-black">
                    “{featuredStory.title}”
                  </p>
                  <p className="mt-2 line-clamp-3 text-xs font-bold text-gray-600">
                    {featuredStory.body}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t-2 border-black/10 pt-3 text-xs font-bold">
                    <span className="rounded bg-[#FFE5EC] px-2 py-0.5 text-[#FF4B72]">{featuredStory.pgName}</span>
                    <span className="text-gray-500">{featuredStory.pgArea}</span>
                  </div>
                </>
              ) : (
                <p className="mt-4 font-heading text-base font-black text-black">Community reviews are arriving daily.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Search Shortcut Bar (Neubrutalism) */}
      <button
        type="button"
        onClick={() => router.push("/search")}
        className="mb-6 flex w-full items-center gap-3 rounded-2xl border-2 border-black bg-white p-3.5 text-left shadow-[3px_3px_0px_#000] transition-transform hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000] active:translate-y-0.5"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[#FFD23F] text-black">
          <Search className="size-4.5" />
        </span>
        <span className="flex-1 text-sm font-bold text-gray-500">
          Search PGs by name, area (OMR, Velachery, Nungambakkam...)
        </span>
        <span className="rounded-lg border-2 border-black bg-[#FFE5EC] p-1.5 text-black">
          <ArrowUpRight className="size-4" />
        </span>
      </button>

      {/* Composer Container */}
      <div id="story-composer" className="mb-6">
        <InlineComposer />
      </div>

      {/* Feed Filters Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3">
        <div>
          <h2 className="font-heading text-xl font-black text-black">What Residents Are Saying</h2>
          <p className="text-xs font-bold text-gray-500">Honest notes and safety reports from verified women</p>
        </div>
        <FilterPillBar options={[...POST_TYPE_OPTIONS]} value={postTypeFilter} onChange={setPostTypeFilter} />
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl border-2 border-black" />
          ))}
        {visibleFeed?.map((post, index) => (
          <FeedPostCard key={post.id} post={post} featured={index === 0} />
        ))}
        {visibleFeed?.length === 0 && (
          <div className="rounded-2xl border-[2.5px] border-black bg-white p-8 text-center shadow-[4px_4px_0px_#000]">
            <span className="mx-auto flex size-12 items-center justify-center rounded-xl border-2 border-black bg-[#FFE5EC] text-[#FF4B72]">
              <MessageCircle className="size-6" />
            </span>
            <h3 className="mt-4 font-heading text-lg font-black text-black">No posts in this category yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs font-bold text-gray-600">
              Be the first to share an honest story or ask a question about your hostel.
            </p>
            <button
              type="button"
              onClick={openComposer}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#FFD23F] px-4 py-2 text-xs font-black text-black shadow-[2px_2px_0px_#000]"
            >
              Share your story
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
