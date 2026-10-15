"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, Link2, BarChart3, Feather } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PgPickerDialog } from "./pg-picker-dialog";
import { fetchProfile } from "@/lib/api/adapters";

export function InlineComposer() {
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [attachIntent, setAttachIntent] = useState<"image" | "link" | "poll" | null>(null);

  const openPicker = (intent: "image" | "link" | "poll" | null = null) => {
    setAttachIntent(intent);
    setPickerOpen(true);
  };

  return (
    <div className="mb-5 rounded-[1.5rem] border border-border bg-card p-4 shadow-[0_12px_32px_-28px_rgba(8,24,40,0.5)] sm:p-5">
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary-hover">
            {profile?.displayName
              .split(" ")
              .map((p) => p[0])
              .join("") ?? "?"}
          </AvatarFallback>
        </Avatar>
        <button
          id="story-composer-trigger"
          type="button"
          onClick={() => openPicker()}
          className="min-h-12 min-w-0 flex-1 truncate rounded-full border border-border bg-background px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary-soft/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          What do you wish you knew before moving here?
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" className="min-h-11 gap-1.5 rounded-full px-3 text-xs text-muted-foreground" onClick={() => openPicker("image")}>
            <ImageIcon className="size-3.5" />
            Image
          </Button>
          <Button variant="ghost" size="sm" className="min-h-11 gap-1.5 rounded-full px-3 text-xs text-muted-foreground" onClick={() => openPicker("link")}>
            <Link2 className="size-3.5" />
            Link
          </Button>
          <Button variant="ghost" size="sm" className="min-h-11 gap-1.5 rounded-full px-3 text-xs text-muted-foreground" onClick={() => openPicker("poll")}>
            <BarChart3 className="size-3.5" />
            Poll
          </Button>
        </div>
        <Button size="sm" className="min-h-11 gap-2 rounded-full px-4" onClick={() => openPicker()}>
          <Feather className="size-4" /> Share a story
        </Button>
      </div>

      <PgPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} isAnonymous={false} attachIntent={attachIntent} />
    </div>
  );
}
