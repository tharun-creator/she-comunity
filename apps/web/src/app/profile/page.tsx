"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, Home as HomeIcon, Bookmark } from "lucide-react";
import { AppShell } from "@/components/shestays/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PgCard } from "@/components/shestays/pg-card";
import { fetchProfile, fetchPgsByIds } from "@/lib/api/adapters";

export default function ProfilePage() {
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

  return (
    <AppShell>
      {isLoading || !profile ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="size-14 shrink-0 sm:size-16">
                <AvatarFallback className="text-base font-semibold text-primary-hover bg-primary-soft sm:text-lg">
                  {profile.displayName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="truncate font-heading text-base font-bold text-heading sm:text-lg">
                  {profile.displayName}
                </h1>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  {profile.city}
                </p>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-secondary/60 p-2.5 text-xs leading-relaxed text-muted-foreground">
              This is your private profile. Anonymous posts never appear here or anywhere else — not
              even to you as a public list — they&apos;re only stored internally for moderation.
            </p>
          </div>

          <section>
            <h2 className="mb-2.5 flex items-center gap-1.5 font-heading text-sm font-semibold text-heading">
              <HomeIcon className="size-4" />
              PGs lived at
              <span className="font-normal text-muted-foreground">({profile.pgsLivedAt.length})</span>
            </h2>
            {livedAtLoading ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : livedAtPgs && livedAtPgs.length > 0 ? (
              <div className="space-y-3">
                {livedAtPgs.map((pg) => (
                  <PgCard key={pg.id} pg={pg} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No PGs yet — join one from its place page once you find it.
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-2.5 flex items-center gap-1.5 font-heading text-sm font-semibold text-heading">
              <Bookmark className="size-4" />
              Saved PGs
              <span className="font-normal text-muted-foreground">({profile.savedPgIds.length})</span>
            </h2>
            {savedLoading ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : savedPgs && savedPgs.length > 0 ? (
              <div className="space-y-3">
                {savedPgs.map((pg) => (
                  <PgCard key={pg.id} pg={pg} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Nothing saved yet — tap Save on any post to keep it here.
              </p>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
