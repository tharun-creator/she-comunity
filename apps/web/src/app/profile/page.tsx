"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Home as HomeIcon, Bookmark, Sparkles, Pencil, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/shestays/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { PgCard } from "@/components/shestays/pg-card";
import { AvatarPickerModal } from "@/components/shestays/avatar-picker-modal";
import { fetchProfile, fetchPgsByIds } from "@/lib/api/adapters";

export default function ProfilePage() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const { data: livedAtPgs, isLoading: livedAtLoading } = useQuery({
    queryKey: ["profile-pgs", "lived-at", profile?.pgsLivedAt],
    queryFn: () => fetchPgsByIds(profile!.pgsLivedAt),
    enabled: !!profile,
  });

  const { data: savedPgs, isLoading: savedLoading } = useQuery({
    queryKey: ["profile-pgs", "saved", profile?.savedPgIds],
    queryFn: () => fetchPgsByIds(profile!.savedPgIds),
    enabled: !!profile,
  });

  const avatarSrc = profile?.avatarUrl || "/avatars/avatar-1.png";

  return (
    <AppShell>
      {isLoading || !profile ? (
        <Skeleton className="h-44 w-full rounded-2xl border-2 border-black" />
      ) : (
        <div className="space-y-6">
          {/* Neubrutalism Profile Card */}
          <div className="relative overflow-hidden rounded-2xl border-[2.5px] border-black bg-white p-5 shadow-[5px_5px_0px_#000] sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Interactive Illustrated Avatar */}
                <div className="relative group">
                  <div className="size-20 overflow-hidden rounded-full border-[2.5px] border-black bg-[#FFE5EC] shadow-[3px_3px_0px_#000] sm:size-24">
                    <Image
                      src={avatarSrc}
                      alt={profile.displayName}
                      width={100}
                      height={100}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-black bg-[#FFD23F] text-black shadow-[1.5px_1.5px_0px_#000] transition-transform hover:scale-110 active:scale-95"
                    title="Change community avatar"
                  >
                    <Pencil className="size-4 stroke-[2.5]" />
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate font-heading text-xl font-black text-black sm:text-2xl">
                      {profile.displayName}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-md border-1.5 border-black bg-[#05D5A4] px-1.5 py-0.5 text-[10px] font-black text-black shadow-[1px_1px_0px_#000]">
                      <ShieldCheck className="size-3" /> Verified
                    </span>
                  </div>

                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-gray-600">
                    <MapPin className="size-3.5 shrink-0 text-[#FF4B72]" />
                    {profile.city || "Chennai"}
                  </p>

                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#FFE5EC] px-3 py-1 text-xs font-black text-black shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
                  >
                    <Sparkles className="size-3 text-[#FF4B72]" /> Change Illustrated Avatar
                  </button>
                </div>
              </div>

              {/* Spot Illustration from Image 1: ID Verification */}
              <div className="hidden sm:block shrink-0">
                <div className="relative size-20 overflow-hidden rounded-xl border-2 border-black bg-[#FFFDF9] p-1 shadow-[2px_2px_0px_#000]">
                  <Image
                    src="/illustrations/id-verification.png"
                    alt="ID verification"
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2.5 rounded-xl border-2 border-black bg-[#FFFDF9] p-3 text-xs font-bold text-gray-700 shadow-[2px_2px_0px_#000]">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-black bg-[#FFD23F] text-[10px] font-black">
                i
              </span>
              <span>
                This is your private community profile. Anonymous reviews never reveal your identity and are encrypted server-side.
              </span>
            </div>
          </div>

          {/* Avatar Picker Modal */}
          <AvatarPickerModal
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            currentAvatarUrl={profile.avatarUrl}
          />

          {/* PGs Lived At */}
          <section>
            <div className="mb-3 flex items-center justify-between border-b-2 border-black pb-2">
              <h2 className="flex items-center gap-2 font-heading text-base font-black text-black">
                <HomeIcon className="size-4 text-[#FF4B72]" />
                PGs Lived At
                <span className="rounded-md border border-black bg-[#FFD23F] px-1.5 py-0.2 text-xs font-black">
                  {profile.pgsLivedAt.length}
                </span>
              </h2>
            </div>

            {livedAtLoading ? (
              <Skeleton className="h-28 w-full rounded-2xl border-2 border-black" />
            ) : livedAtPgs && livedAtPgs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {livedAtPgs.map((pg) => (
                  <PgCard key={pg.id} pg={pg} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black bg-white p-6 text-center">
                <p className="text-xs font-bold text-gray-500">
                  No previous PGs listed yet. Find and join your current PG from the discovery page.
                </p>
              </div>
            )}
          </section>

          {/* Saved PGs */}
          <section>
            <div className="mb-3 flex items-center justify-between border-b-2 border-black pb-2">
              <h2 className="flex items-center gap-2 font-heading text-base font-black text-black">
                <Bookmark className="size-4 text-[#FFD23F]" />
                Saved Hostels & Bookmarks
                <span className="rounded-md border border-black bg-[#FFE5EC] px-1.5 py-0.2 text-xs font-black">
                  {profile.savedPgIds.length}
                </span>
              </h2>
            </div>

            {savedLoading ? (
              <Skeleton className="h-28 w-full rounded-2xl border-2 border-black" />
            ) : savedPgs && savedPgs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {savedPgs.map((pg) => (
                  <PgCard key={pg.id} pg={pg} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black bg-white p-6 text-center">
                <p className="text-xs font-bold text-gray-500">
                  Bookmark helpful places or discussions to revisit them here.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
