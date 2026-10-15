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

  const avatarSrc = profile?.avatarUrl || "/avatars/avatar-4.png";

  return (
    <AppShell>
      {isLoading || !profile ? (
        <Skeleton className="h-44 w-full rounded-2xl" />
      ) : (
        <div className="space-y-6">
          {/* Profile Card matching Mockup */}
          <div className="relative overflow-hidden rounded-2xl border border-[#F0E6E8] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Interactive Illustrated Avatar */}
                <div className="relative group">
                  <div className="size-20 overflow-hidden rounded-full border-2 border-[#FFE8EE] bg-[#FFF0F3] shadow-sm sm:size-24">
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
                    className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-[#FF386B] text-white shadow-sm transition-transform hover:scale-110 active:scale-95"
                    title="Change community avatar"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate font-heading text-xl font-bold text-gray-900 sm:text-2xl">
                      {profile.displayName}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E6FBF5] px-2 py-0.5 text-[10px] font-bold text-[#05D5A4]">
                      <ShieldCheck className="size-3" /> Verified
                    </span>
                  </div>

                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 font-medium">
                    <MapPin className="size-3.5 shrink-0 text-[#FF386B]" />
                    {profile.city || "Chennai"}
                  </p>

                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#FCE4EC] bg-[#FFF0F3] px-3.5 py-1 text-xs font-semibold text-[#FF386B] transition-colors hover:bg-[#FFE8EE]"
                  >
                    <Sparkles className="size-3 text-[#FF386B]" /> Change Illustrated Avatar
                  </button>
                </div>
              </div>

              {/* ID Verification Spot Illustration */}
              <div className="hidden sm:block shrink-0">
                <div className="relative size-20 overflow-hidden rounded-2xl border border-[#F0E6E8] bg-[#FAF8F8] p-1.5 shadow-xs">
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

            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#FCE4EC] bg-[#FFF0F3] p-3 text-xs text-gray-700">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#FF386B] text-[10px] font-bold text-white">
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
            <div className="mb-3 flex items-center justify-between border-b border-[#F0E6E8] pb-2">
              <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-gray-900">
                <HomeIcon className="size-4 text-[#FF386B]" />
                PGs Lived At
                <span className="rounded-full bg-[#FFE8EE] px-2 py-0.5 text-xs font-bold text-[#FF386B]">
                  {profile.pgsLivedAt.length}
                </span>
              </h2>
            </div>

            {livedAtLoading ? (
              <Skeleton className="h-28 w-full rounded-2xl" />
            ) : livedAtPgs && livedAtPgs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {livedAtPgs.map((pg) => (
                  <PgCard key={pg.id} pg={pg} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#F0E6E8] bg-white p-6 text-center">
                <p className="text-xs text-gray-500">
                  No previous PGs listed yet. Find and join your current PG from the discovery page.
                </p>
              </div>
            )}
          </section>

          {/* Saved PGs */}
          <section>
            <div className="mb-3 flex items-center justify-between border-b border-[#F0E6E8] pb-2">
              <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-gray-900">
                <Bookmark className="size-4 text-[#F59E0B]" />
                Saved Hostels & Bookmarks
                <span className="rounded-full bg-[#FFE8EE] px-2 py-0.5 text-xs font-bold text-[#FF386B]">
                  {profile.savedPgIds.length}
                </span>
              </h2>
            </div>

            {savedLoading ? (
              <Skeleton className="h-28 w-full rounded-2xl" />
            ) : savedPgs && savedPgs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {savedPgs.map((pg) => (
                  <PgCard key={pg.id} pg={pg} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#F0E6E8] bg-white p-6 text-center">
                <p className="text-xs text-gray-500">
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
