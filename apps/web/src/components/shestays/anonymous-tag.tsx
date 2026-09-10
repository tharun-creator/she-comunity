import { VenetianMask } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthorView } from "@/types/domain";

export function AuthorLine({ author, className }: { author: AuthorView; className?: string }) {
  if (author.isAnonymous) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[13px] font-medium text-anonymous",
          className
        )}
      >
        <VenetianMask className="size-3.5" aria-hidden />
        {author.anonymousTag ?? "Anonymous Resident"}
      </span>
    );
  }

  return (
    <span className={cn("text-[13px] font-semibold text-foreground", className)}>
      {author.displayName}
    </span>
  );
}
