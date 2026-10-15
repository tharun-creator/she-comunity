"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Sparkles } from "lucide-react";
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
  const [selected, setSelected] = useState<string>(currentAvatarUrl || AVATAR_OPTIONS[3].src);

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
      <DialogContent className="max-w-xl rounded-2xl border border-[#F0E6E8] bg-white p-6 shadow-xl">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#FFE8EE] px-3 py-1 text-xs font-bold text-[#FF386B]">
            <Sparkles className="size-3.5" />
            Personalize Your Identity
          </div>
          <DialogTitle className="mt-2 font-heading text-xl font-bold text-gray-900">
            Choose Your Community Avatar
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Pick an illustration that best represents your style. This avatar will show on your profile and named reviews.
          </DialogDescription>
        </DialogHeader>

        {/* 15 Avatars Selection Grid */}
        <div className="grid grid-cols-3 gap-3 py-4 sm:grid-cols-5 max-h-[360px] overflow-y-auto p-1 [scrollbar-width:none]">
          {AVATAR_OPTIONS.map((av) => {
            const isChosen = selected === av.src;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => setSelected(av.src)}
                className={cn(
                  "group relative flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition-all cursor-pointer",
                  isChosen
                    ? "bg-[#FFE8EE] border-[#FF386B] ring-2 ring-[#FF386B] scale-102"
                    : "bg-white border-[#F0E6E8] hover:bg-[#FAF8F8] hover:scale-102"
                )}
              >
                <div className="relative size-16 overflow-hidden rounded-full border border-[#FFE8EE] bg-[#FFF0F3]">
                  <Image
                    src={av.src}
                    alt={av.label}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                  {isChosen && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[0.5px]">
                      <span className="flex size-6 items-center justify-center rounded-full bg-[#FF386B] text-white">
                        <Check className="size-3.5 stroke-[3]" />
                      </span>
                    </div>
                  )}
                </div>
                <span className="truncate text-center text-[10px] font-bold text-gray-800 max-w-[80px]">
                  {av.label}
                </span>
              </button>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-[#F0E6E8] pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(selected)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FF386B] px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#E02657] disabled:opacity-50"
          >
            {mutation.isPending ? "Saving..." : "Set As Avatar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
