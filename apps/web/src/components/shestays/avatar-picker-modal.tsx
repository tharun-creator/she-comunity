"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Sparkles, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateProfileAvatar } from "@/lib/api/adapters/auth";
import { cn } from "@/lib/utils";

export const AVATAR_OPTIONS = [
  { id: 1, src: "/avatars/avatar-1.png", label: "Casual Waves" },
  { id: 2, src: "/avatars/avatar-2.png", label: "Glasses & Bun" },
  { id: 3, src: "/avatars/avatar-3.png", label: "Pink Headband" },
  { id: 4, src: "/avatars/avatar-4.png", label: "High Ponytail" },
  { id: 5, src: "/avatars/avatar-5.png", label: "Low Bun" },
  { id: 6, src: "/avatars/avatar-6.png", label: "Curly Bob" },
  { id: 7, src: "/avatars/avatar-7.png", label: "Classic Lob" },
  { id: 8, src: "/avatars/avatar-8.png", label: "Hijabi Chic" },
  { id: 9, src: "/avatars/avatar-9.png", label: "Hairclip Style" },
  { id: 10, src: "/avatars/avatar-10.png", label: "Music & Beats" },
  { id: 11, src: "/avatars/avatar-11.png", label: "Sporty Cap" },
  { id: 12, src: "/avatars/avatar-12.png", label: "Cozy Hoodie" },
  { id: 13, src: "/avatars/avatar-13.png", label: "Student Glasses" },
  { id: 14, src: "/avatars/avatar-14.png", label: "Flower Pin" },
  { id: 15, src: "/avatars/avatar-15.png", label: "Ribbon Tie" },
] as const;

interface AvatarPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string | null;
}

export function AvatarPickerModal({
  open,
  onOpenChange,
  currentAvatarUrl,
}: AvatarPickerModalProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string>(currentAvatarUrl || AVATAR_OPTIONS[0].src);

  const mutation = useMutation({
    mutationFn: (avatarUrl: string) => updateProfileAvatar(avatarUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile avatar updated!", {
        description: "Your illustrated avatar is now visible across the community.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update avatar. Please try again.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border-[3px] border-black bg-[#FFFDF9] p-6 shadow-[6px_6px_0px_#000]">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-1.5 rounded-lg border-2 border-black bg-[#FFD23F] px-2 py-0.5 text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_#000]">
            <Sparkles className="size-3.5 fill-black" />
            Personalize Your Identity
          </div>
          <DialogTitle className="mt-2 font-heading text-xl font-black text-black">
            Choose Your Community Avatar
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-gray-600">
            Pick a flat illustration that best represents your style. This avatar will show on your profile and named reviews.
          </DialogDescription>
        </DialogHeader>

        {/* 15 Avatars Neubrutalist Selection Grid */}
        <div className="grid grid-cols-3 gap-3.5 py-4 sm:grid-cols-5 max-h-[360px] overflow-y-auto p-1 scrollbar-hide">
          {AVATAR_OPTIONS.map((av) => {
            const isChosen = selected === av.src;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => setSelected(av.src)}
                className={cn(
                  "group relative flex flex-col items-center gap-1.5 rounded-xl border-2 border-black p-2 transition-all cursor-pointer",
                  isChosen
                    ? "bg-[#FFE5EC] shadow-[3px_3px_0px_#FF4B72] ring-2 ring-black -translate-y-1"
                    : "bg-white shadow-[2px_2px_0px_#000] hover:bg-gray-50 hover:-translate-y-0.5"
                )}
              >
                <div className="relative size-16 overflow-hidden rounded-full border-2 border-black bg-pink-50">
                  <Image
                    src={av.src}
                    alt={av.label}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                  {isChosen && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                      <span className="flex size-6 items-center justify-center rounded-full border border-black bg-[#05D5A4] text-black">
                        <Check className="size-4 stroke-[3]" />
                      </span>
                    </div>
                  )}
                </div>
                <span className="truncate text-center text-[10px] font-black text-black max-w-[80px]">
                  {av.label}
                </span>
              </button>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t-2 border-black/10 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-2 border-black bg-white px-4 py-2 text-xs font-black text-black shadow-[2px_2px_0px_#000] hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(selected)}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#FF4B72] px-5 py-2 text-xs font-black text-white shadow-[2.5px_2.5px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-50"
          >
            {mutation.isPending ? "Saving..." : "Set As Avatar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
