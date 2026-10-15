"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTrendingDiscussions } from "@/lib/api/adapters";
import { relativeTime } from "@/lib/format";

export function TrendingDiscussionsPanel() {
  const { data: discussions, isLoading } = useQuery({
    queryKey: ["trending-discussions"],
    queryFn: fetchTrendingDiscussions,
  });

  return (
    <section className="space-y-3 rounded-2xl border-2 border-black bg-white p-4 shadow-[3px_3px_0px_#000]">
      <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
        <h2 className="flex items-center gap-1.5 font-heading text-xs font-black uppercase tracking-wider text-black">
          <Flame className="size-4 text-[#FF4B72]" />
          Trending Discussions
        </h2>
        <Link href="/search" className="shrink-0 text-xs font-black text-[#FF4B72] hover:underline">
          See all
        </Link>
      </div>

      <div className="space-y-2.5">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl border border-black" />)}
        {discussions?.map((d, i) => (
          <Link key={d.id} href={`/pg/${d.pgId}/post/${d.id}`} className="group flex min-h-10 items-start gap-2.5 rounded-lg focus:outline-none">
            <span className="flex size-5 shrink-0 items-center justify-center rounded border border-black bg-[#FFD23F] text-[10px] font-black text-black">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-black group-hover:text-[#FF4B72]">{d.title}</p>
              <p className="text-[10px] font-bold text-gray-500">
                {d.commentCount} replies · {relativeTime(d.createdAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
