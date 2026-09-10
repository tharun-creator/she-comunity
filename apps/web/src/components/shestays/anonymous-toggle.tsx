"use client";

import { VenetianMask, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function AnonymousToggle({
  isAnonymous,
  onChange,
  displayName,
}: {
  isAnonymous: boolean;
  onChange: (value: boolean) => void;
  displayName: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-medium",
            !isAnonymous ? "text-heading" : "text-muted-foreground"
          )}
        >
          <User className="size-4" />
          Post as {displayName}
        </span>
        <Switch checked={isAnonymous} onCheckedChange={onChange} aria-label="Post anonymously" />
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-medium",
            isAnonymous ? "text-anonymous" : "text-muted-foreground"
          )}
        >
          <VenetianMask className="size-4" />
          Post as Anonymous
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Your identity is never shown, but our team can still act on reports.
      </p>
    </div>
  );
}
