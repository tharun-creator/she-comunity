"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function VoteControl({
  upvotes,
  downvotes,
  myVote,
  onVote,
  orientation = "vertical",
  size = "default",
}: {
  upvotes: number;
  downvotes: number;
  myVote: 1 | -1 | 0;
  onVote: (next: 1 | -1 | 0) => void;
  orientation?: "vertical" | "horizontal";
  size?: "default" | "sm";
}) {
  const score = upvotes - downvotes;
  const btnSize = size === "sm" ? "size-6" : "size-7";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        orientation === "vertical" ? "flex-col" : "flex-row"
      )}
    >
      <button
        type="button"
        aria-label="Upvote"
        aria-pressed={myVote === 1}
        onClick={() => onVote(myVote === 1 ? 0 : 1)}
        className={cn(
          "flex items-center justify-center rounded-full transition-colors cursor-pointer",
          btnSize,
          myVote === 1
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <ChevronUp className={iconSize} />
      </button>
      <span
        className={cn(
          "min-w-5 text-center text-sm font-semibold tabular-nums",
          myVote === 1 && "text-primary",
          myVote === -1 && "text-danger"
        )}
      >
        {score}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        aria-pressed={myVote === -1}
        onClick={() => onVote(myVote === -1 ? 0 : -1)}
        className={cn(
          "flex items-center justify-center rounded-full transition-colors cursor-pointer",
          btnSize,
          myVote === -1
            ? "bg-danger/10 text-danger"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <ChevronDown className={iconSize} />
      </button>
    </div>
  );
}
