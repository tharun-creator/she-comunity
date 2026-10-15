"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flame, ChevronRight, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTrendingDiscussions } from "@/lib/api/adapters";
import { relativeTime } from "@/lib/format";

const FALLBACK_DISCUSSIONS = [
  {
    id: "post-6",
    pgId: "pg-1",
    title: "Best time to visit the OMR area PGs...",
    author: "anjali98",
    time: "4h ago",
  },
  {
    id: "post-2",
    pgId: "pg-1",
    title: "Anyone else's warden reading room...",
    author: "keerthi",
    time: "6h ago",
  },
  {
    id: "post-1",
    pgId: "pg-1",
    title: "6 months in — honest review",
    author: "divya_s",
    time: "8h ago",
  },
  {
    id: "post-3",
    pgId: "pg-2",
    title: "Would you want a shared kitchen s...",
    author: "sneha_k",
    time: "12h ago",
  },
];

export function TrendingDiscussionsPanel() {
  const { data: discussions, isLoading } = useQuery({
    queryKey: ["trending-discussions"],
    queryFn: fetchTrendingDiscussions,
  });

  const displayList = (discussions && discussions.length > 0)
    ? discussions.slice(0, 4).map((d) => ({
        id: d.id,
        pgId: d.pgId,
        title: d.title,
        author: d.author?.displayName?.toLowerCase().replace(/\s+/g, "") || "resident",
        time: relativeTime(d.createdAt),
      }))
    : FALLBACK_DISCUSSIONS;

  return (
    <div className="rounded-2xl border border-[#F0E6E8] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3">
        <h3 className="flex items-center gap-1.5 font-heading text-sm font-bold text-gray-900">
          <Flame className="size-4 text-[#FF386B]" />
          Trending Discussions
        </h3>
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#FF386B] hover:underline"
        >
          See all <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}

        {!isLoading &&
          displayList.map((item, index) => (
            <Link
              key={item.id}
              href={`/pg/${item.pgId}/post/${item.id}`}
              className="group flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-[#FAF8F8]"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FFE8EE] text-xs font-bold text-[#FF386B]">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-gray-900 group-hover:text-[#FF386B] transition-colors">
                  {item.title}
                </p>
                <p className="text-[11px] text-gray-400">
                  {item.author} • {item.time}
                </p>
              </div>
              <ChevronRight className="size-3.5 text-gray-300 group-hover:text-[#FF386B] transition-colors" />
            </Link>
          ))}
      </div>
    </div>
  );
}
