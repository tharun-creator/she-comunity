"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, Link2, BarChart3, Send } from "lucide-react";
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

  const avatarSrc = profile?.avatarUrl || "/avatars/avatar-4.png";

  return (
    <div className="rounded-2xl border border-[#F0E6E8] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="size-10 shrink-0 overflow-hidden rounded-full border border-[#FFE8EE] bg-[#FFF0F3]">
          <Image
            src={avatarSrc}
            alt="Your avatar"
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </div>

        <button
          id="story-composer-trigger"
          type="button"
          onClick={() => openPicker()}
          className="flex min-h-11 min-w-0 flex-1 items-center rounded-full border border-[#F0E6E8] bg-[#FAF8F8] px-4 py-2.5 text-left text-xs sm:text-sm text-gray-500 transition-colors hover:border-[#FF386B]/30 hover:bg-white focus:outline-none"
        >
          <span className="truncate">What do you wish you knew before moving here?</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#F0E6E8] pt-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => openPicker("image")}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 transition-colors hover:text-[#FF386B]"
          >
            <ImageIcon className="size-4" />
            <span>Image</span>
          </button>
          <button
            type="button"
            onClick={() => openPicker("link")}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 transition-colors hover:text-[#FF386B]"
          >
            <Link2 className="size-4" />
            <span>Link</span>
          </button>
          <button
            type="button"
            onClick={() => openPicker("poll")}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 transition-colors hover:text-[#FF386B]"
          >
            <BarChart3 className="size-4" />
            <span>Poll</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => openPicker()}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#FF386B] px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#E02657] active:scale-95"
        >
          <Send className="size-3.5" />
          <span>Share a story</span>
        </button>
      </div>

      <PgPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        isAnonymous={false}
        attachIntent={attachIntent}
      />
    </div>
  );
}
