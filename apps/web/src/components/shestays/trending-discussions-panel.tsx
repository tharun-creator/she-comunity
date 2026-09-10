"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTrendingDiscussions } from "@/lib/mock-data";
import { relativeTime } from "@/lib/format";

export function TrendingDiscussionsPanel() {
  const { data: discussions, isLoading } = useQuery({
    queryKey: ["trending-discussions"],
    queryFn: fetchTrendingDiscussions,
  });

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-heading text-sm font-semibold text-heading">
          <Flame className="size-4 text-danger" />
          Trending discussions
        </h2>
        <Link href="/search" className="shrink-0 text-xs font-medium text-primary hover:underline">
          See all
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        {discussions?.map((d, i) => (
          <Link key={d.postId} href={`/pg/${d.pgId}/post/${d.postId}`} className="flex items-start gap-2.5 group">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-heading group-hover:text-primary">{d.title}</p>
              <p className="text-xs text-muted-foreground">
                {d.replyCount} replies · {relativeTime(d.lastActivityAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
