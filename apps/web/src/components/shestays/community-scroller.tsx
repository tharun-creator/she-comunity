"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchJoinedPgs } from "@/lib/mock-data";

const TINTS = ["bg-primary-soft text-primary-hover", "bg-secondary text-secondary-foreground", "bg-warning/15 text-warning", "bg-success/15 text-success"];

export function CommunityScroller() {
  const { data: pgs } = useQuery({ queryKey: ["joined-pgs"], queryFn: fetchJoinedPgs });

  if (!pgs?.length) return null;

  return (
    <div className="mb-3 flex gap-3 overflow-x-auto pb-1 lg:hidden [scrollbar-width:none]">
      {pgs.map((pg, i) => (
        <Link key={pg.id} href={`/pg/${pg.id}`} className="flex w-16 shrink-0 flex-col items-center gap-1">
          <span
            className={`flex size-12 items-center justify-center rounded-full text-xs font-semibold ${TINTS[i % TINTS.length]}`}
          >
            {pg.name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
          <span className="line-clamp-2 text-center text-[11px] leading-tight text-muted-foreground">
            {pg.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
