"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, Link2, BarChart3 } from "lucide-react";
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
    <div className="mb-4 rounded-2xl border border-border bg-card p-3.5">
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
          type="button"
          onClick={() => openPicker()}
          className="flex-1 truncate rounded-full border border-border bg-secondary/40 px-4 py-2 text-left text-sm text-muted-foreground hover:bg-secondary/70"
        >
          Share something with your community…
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={() => openPicker("image")}>
            <ImageIcon className="size-3.5" />
            Image
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={() => openPicker("link")}>
            <Link2 className="size-3.5" />
            Link
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={() => openPicker("poll")}>
            <BarChart3 className="size-3.5" />
            Poll
          </Button>
        </div>
        <Button size="sm" onClick={() => openPicker()}>
          Create post
        </Button>
      </div>

      <PgPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} isAnonymous={false} attachIntent={attachIntent} />
    </div>
  );
}
