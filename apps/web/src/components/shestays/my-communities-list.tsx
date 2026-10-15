"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Users2, MapPin } from "lucide-react";
import { CHENNAI_AREAS } from "@/types/domain";
import { cn } from "@/lib/utils";

const VISIBLE_COUNT = 4;

export function MyCommunitiesList() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeArea = pathname === "/" ? searchParams.get("area") : null;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex items-center gap-1.5 px-1">
        <Users2 className="size-4 text-heading" />
        <p className="text-sm font-semibold text-heading">My Communities</p>
      </div>
      <div className="mt-2 space-y-0.5">
        {CHENNAI_AREAS.slice(0, VISIBLE_COUNT).map((area) => {
          const active = activeArea === area;
          return (
            <Link
              key={area}
              href={`/?area=${encodeURIComponent(area)}`}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active ? "bg-primary-soft text-primary-hover font-medium" : "text-body hover:bg-muted"
              )}
            >
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{area}</span>
            </Link>
          );
        })}
        <Link href="/search" className="flex min-h-11 items-center px-1 text-xs font-medium text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          View all ({CHENNAI_AREAS.length - VISIBLE_COUNT})
        </Link>
      </div>
    </div>
  );
}
