import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pg } from "@/types/domain";

const TINTS = [
  "bg-primary-soft text-primary-hover",
  "bg-secondary text-secondary-foreground",
  "bg-warning/15 text-warning",
  "bg-success/15 text-success",
];

export function PgListRow({
  pg,
  tintIndex = 0,
  onJoin,
  joining = false,
}: {
  pg: Pg;
  tintIndex?: number;
  onJoin?: (pgId: string) => void;
  joining?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${TINTS[tintIndex % TINTS.length]}`}
      >
        {pg.name
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0])
          .join("")}
      </span>
      <div className="min-w-0 flex-1">
        <Link href={`/pg/${pg.id}`} className="block truncate text-sm font-medium text-heading hover:text-primary">
          {pg.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">{pg.area}</p>
        <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3" />
          {pg.memberCount} members
        </span>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <Link href={`/pg/${pg.id}`}>
          <Button variant="outline" size="sm" className="h-7 w-16 px-0 text-xs">
            View
          </Button>
        </Link>
        {onJoin && (
          <Button size="sm" className="h-7 w-16 px-0 text-xs" disabled={joining} onClick={() => onJoin(pg.id)}>
            Join
          </Button>
        )}
      </div>
    </div>
  );
}
