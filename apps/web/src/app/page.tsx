"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowRight, 
  MapPin, 
  Pencil, 
  Search, 
  Star, 
  Users, 
  ShieldCheck, 
  ChevronRight, 
  Send 
} from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const { data: feed, isLoading } = useQuery({
    queryKey: ["home-feed", areaParam],
    queryFn: () => fetchHomeFeed(areaParam ?? "All"),
  });

  const visibleFeed = feed?.filter(
    (post) => postTypeFilter === "All" || post.type === POST_TYPE_MAP[postTypeFilter]
  );

  const openComposer = () => {
    document.getElementById("story-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("story-composer-trigger")?.focus({ preventScroll: true });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <AppShell rightSidebar={<div className="space-y-4"><TrendingDiscussionsPanel /><SuggestedPgsPanel /></div>}>
      <div className="space-y-5">
        {/* 1. Hero Banner matching Mockup */}
        <section className="relative overflow-hidden rounded-3xl border border-[#FCE4EC] bg-[#FFF0F3] p-6 sm:p-8">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-center">
            <div>
              {/* Chennai Yellow Pill */}
              <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#78350F]">
                <MapPin className="size-3.5 text-[#78350F]" />
                CHENNAI • WOMEN COMMUNITY FIRST
              </div>

              {/* Title with pink 'yours.' badge */}
              <h1 className="font-heading text-3xl font-black leading-tight tracking-tight text-gray-950 sm:text-4xl lg:text-[2.65rem]">
                Find a place that feels like{" "}
                <span className="inline-block rounded-full bg-[#FF386B] px-3.5 py-0.5 text-white">
                  yours.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-3 text-xs sm:text-sm font-medium text-gray-600 max-w-md leading-relaxed">
                Real, unfiltered stories from women who lived there. Check safety ratings, warden rules, and real food quality.
              </p>

              {/* CTA Buttons */}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/search")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#FF386B] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#E02657] active:scale-95"
                >
                  <Search className="size-4" />
                  Find PGs & Hostels
                  <ArrowRight className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={openComposer}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#F0E6E8] bg-white px-5 py-3 text-xs sm:text-sm font-bold text-gray-800 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
                >
                  <Pencil className="size-3.5 text-gray-700" />
                  Write a Review
                </button>
              </div>

              {/* Stats Row matching Mockup */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600 sm:gap-6">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4 text-[#FF386B]" />
                  3.2k+ stories nearby
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-[#FF386B]" />
                  5k+ women&apos;s reviews
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="size-4 fill-[#FF386B] text-[#FF386B]" />
                  4.8 avg. rating
                </span>
              </div>
            </div>

            {/* Right illustration with soft pink curve backdrop */}
            <div className="relative hidden items-center justify-center lg:flex">
              <div className="relative size-64 xl:size-72 flex items-center justify-center">
                {/* Background decorative rounded blob */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD6E2] to-[#FFE8EE] opacity-70" />
                <Image
                  src="/illustrations/coffee-relax.png"
                  alt="Woman enjoying coffee"
                  width={240}
                  height={240}
                  className="relative z-10 size-56 xl:size-64 object-contain drop-shadow-sm"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Resident Spotlight Card matching Mockup */}
        <section className="rounded-2xl border border-[#F0E6E8] bg-white p-5 shadow-sm">
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0F3] px-3 py-1 text-xs font-bold text-[#FF386B]">
              <Star className="size-3 fill-[#FF386B]" />
              Resident Spotlight
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Avatar on Left */}
            <div className="size-16 sm:size-20 shrink-0 overflow-hidden rounded-full border-2 border-[#FFE8EE] bg-[#FFF0F3]">
              <Image
                src="/avatars/avatar-4.png"
                alt="Resident"
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Middle Quote Content */}
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-sm sm:text-base font-black text-gray-900 leading-snug">
                “Best time to visit the OMR area PGs before signing!”
              </h3>
              <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-600 leading-relaxed">
                Planning to shortlist a few PGs around Sholinganallur this weekend. Any tips on what to check in person that you can&apos;t tell from photos or reviews alone?
              </p>
              
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-[#FFF0F3] px-3 py-0.5 text-xs font-bold text-[#FF386B]">
                  Sunrise Ladies PG
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  — Priya, OMR
                </span>
              </div>
            </div>

            {/* Next Chevron Button on Right */}
            <button
              type="button"
              onClick={() => router.push("/search")}
              aria-label="Next spotlight"
              className="hidden sm:flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-black transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </section>

        {/* 3. Search Bar Container matching Mockup */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 rounded-full border border-[#F0E6E8] bg-white p-2 pl-2.5 pr-2 shadow-sm transition-colors focus-within:border-[#FF386B]"
        >
          <button
            type="submit"
            aria-label="Search"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FF386B] text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <Search className="size-4" />
          </button>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PGs by name, area (OMR, Velachery, Nungambakkam...)"
            className="w-full flex-1 bg-transparent px-2 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />

          <button
            type="submit"
            aria-label="Submit search"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FFE8EE] text-[#FF386B] transition-colors hover:bg-[#FFD6E2]"
          >
            <Send className="size-3.5" />
          </button>
        </form>

        {/* 4. Composer Container matching Mockup */}
        <div id="story-composer">
          <InlineComposer />
        </div>

        {/* 5. Feed Filters Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0E6E8] pb-3 pt-2">
          <div>
            <h2 className="font-heading text-lg font-black text-gray-900">What Residents Are Saying</h2>
            <p className="text-xs font-medium text-gray-500">Honest notes and safety reports from verified women</p>
          </div>
          <FilterPillBar options={[...POST_TYPE_OPTIONS]} value={postTypeFilter} onChange={setPostTypeFilter} />
        </div>

        {/* 6. Feed List */}
        <div className="space-y-4">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          {visibleFeed?.map((post, index) => (
            <FeedPostCard key={post.id} post={post} featured={index === 0} />
          ))}
          {visibleFeed?.length === 0 && (
            <div className="rounded-2xl border border-[#F0E6E8] bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 flex w-36 items-center justify-center">
                <Image
                  src="/illustrations/coffee-relax.png"
                  alt="Take a break"
                  width={140}
                  height={140}
                  className="h-28 w-28 object-contain"
                />
              </div>
              <h3 className="font-heading text-base font-bold text-gray-900">No posts in this category yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                Be the first to share an honest story or ask a question about your hostel.
              </p>
              <button
                type="button"
                onClick={openComposer}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#FF386B] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#E02657]"
              >
                Share your story
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
