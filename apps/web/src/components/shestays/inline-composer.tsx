"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, Link2, BarChart3, Feather, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const initials = profile?.displayName
    ? profile.displayName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="rounded-2xl border-[2.5px] border-black bg-white p-4 shadow-[4px_4px_0px_#000] sm:p-5">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className="size-11 border-2 border-black bg-[#FFE5EC] shadow-[1.5px_1.5px_0px_#000]">
            {profile?.avatarUrl && (
              <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
            )}
            <AvatarFallback className="bg-[#FFD23F] text-xs font-black text-black">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <button
          id="story-composer-trigger"
          type="button"
          onClick={() => openPicker()}
          className="group flex min-h-12 min-w-0 flex-1 items-center justify-between rounded-xl border-2 border-black bg-[#FFFDF9] px-4 py-2.5 text-left shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 hover:bg-[#FFE5EC]/30 hover:shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_#000]"
        >
          <span className="truncate text-sm font-bold text-gray-600">
            What do you wish you knew before moving into your PG?
          </span>
          <span className="hidden items-center gap-1 rounded-md border border-black bg-[#FFD23F] px-2 py-0.5 text-[10px] font-black uppercase text-black sm:inline-flex">
            <Sparkles className="size-3 fill-black" /> Post
          </span>
        </button>

        {/* Spot illustration */}
        <div className="hidden shrink-0 lg:block">
          <div className="flex size-11 items-center justify-center rounded-xl border-2 border-black bg-[#FFE5EC] p-1 shadow-[2px_2px_0px_#000]">
            <Image
              src="/illustrations/write-review.png"
              alt="Write review"
              width={40}
              height={40}
              className="size-9 object-contain"
            />
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t-2 border-black/10 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openPicker("image")}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
          >
            <ImageIcon className="size-3.5 text-[#FF4B72]" />
            Photo
          </button>
          <button
            type="button"
            onClick={() => openPicker("link")}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
          >
            <Link2 className="size-3.5 text-[#05D5A4]" />
            Link
          </button>
          <button
            type="button"
            onClick={() => openPicker("poll")}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
          >
            <BarChart3 className="size-3.5 text-[#FFD23F]" />
            Poll
          </button>
        </div>

        <button
          type="button"
          onClick={() => openPicker()}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#FF4B72] px-4 py-2 text-xs font-black text-white shadow-[2.5px_2.5px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
        >
          <Feather className="size-3.5" /> Share story
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
