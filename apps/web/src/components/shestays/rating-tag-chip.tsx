import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RatingTag } from "@/types/domain";

export function RatingTagChip({
  tag,
  value,
  className,
}: {
  tag: RatingTag;
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground",
        className
      )}
    >
      {tag}
      <span className="inline-flex items-center gap-0.5 text-muted-foreground">
        <Star className="size-3 fill-warning text-warning" />
        {value.toFixed(1)}
      </span>
    </span>
  );
}
