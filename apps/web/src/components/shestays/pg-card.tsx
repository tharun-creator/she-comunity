import Link from "next/link";
import { Star, Users, MessageSquare } from "lucide-react";
import { RatingTagChip } from "./rating-tag-chip";
import type { Pg } from "@/types/domain";

export function PgCard({ pg }: { pg: Pg }) {
  const topTags = Object.entries(pg.tagAverages)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3);

  return (
    <Link
      href={`/pg/${pg.id}`}
      className="group block rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold text-heading group-hover:text-primary">
            {pg.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{pg.area}</p>
        </div>
        {pg.aggregateRating != null && (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary-hover">
            <Star className="size-3.5 fill-current" />
            {pg.aggregateRating.toFixed(1)}
          </div>
        )}
      </div>

      {topTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topTags.map(([tag, value]) => (
            <RatingTagChip key={tag} tag={tag as never} value={value ?? 0} />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5" />
          {pg.memberCount} members
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="size-3.5" />
          {pg.reviewCount} reviews
        </span>
        {!pg.isPubliclyVisible && (
          <span className="ml-auto rounded-full bg-warning/15 px-2 py-0.5 font-medium text-warning">
            Seed community
          </span>
        )}
      </div>
    </Link>
  );
}
