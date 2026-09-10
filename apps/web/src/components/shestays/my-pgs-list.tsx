"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJoinedPgs } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const AVATAR_TINTS = [
  "bg-primary-soft text-primary-hover",
  "bg-secondary text-secondary-foreground",
  "bg-warning/15 text-warning",
  "bg-success/15 text-success",
];

const VISIBLE_COUNT = 4;

export function MyPgsList() {
  const pathname = usePathname();
  const { data: pgs, isLoading } = useQuery({ queryKey: ["joined-pgs"], queryFn: fetchJoinedPgs });

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex items-center gap-1.5 px-1">
        <Home className="size-4 text-heading" />
        <p className="text-sm font-semibold text-heading">My PGs</p>
      </div>
      <div className="mt-2 space-y-0.5">
        {isLoading &&
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
        {pgs?.slice(0, VISIBLE_COUNT).map((pg, i) => {
          const active = pathname === `/pg/${pg.id}`;
          return (
            <Link
              key={pg.id}
              href={`/pg/${pg.id}`}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm transition-colors",
                active ? "bg-primary-soft text-primary-hover font-medium" : "text-body hover:bg-muted"
              )}
            >
              <Avatar className="size-7">
                <AvatarFallback className={cn("text-[10px] font-semibold", AVATAR_TINTS[i % AVATAR_TINTS.length])}>
                  {pg.name
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{pg.name}</span>
            </Link>
          );
        })}
        {pgs?.length === 0 && (
          <p className="px-1 py-2 text-xs text-muted-foreground">
            Join a PG&apos;s community from its place page to see it here.
          </p>
        )}
        {pgs && pgs.length > 0 && (
          <Link href="/profile" className="block px-1 pt-1 text-xs font-medium text-muted-foreground hover:text-primary">
            View all ({pgs.length})
          </Link>
        )}
      </div>
    </div>
  );
}
