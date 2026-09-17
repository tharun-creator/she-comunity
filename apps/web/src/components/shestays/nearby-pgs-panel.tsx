"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PgListRow } from "./pg-list-row";
import { fetchNearbyPgs, fetchProfile, joinPg } from "@/lib/api/adapters";

export function NearbyPgsPanel() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const { data: nearby, isLoading } = useQuery({
    queryKey: ["nearby-pgs", profile?.joinedPgIds],
    queryFn: () => fetchNearbyPgs(profile?.joinedPgIds ?? []),
    enabled: !!profile,
  });

  const joinMutation = useMutation({
    mutationFn: (pgId: string) => joinPg(pgId),
    onSuccess: (_updated, pgId) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["joined-pgs"] });
      queryClient.invalidateQueries({ queryKey: ["nearby-pgs"] });
      const pg = nearby?.find((p) => p.id === pgId);
      toast.success(pg ? `Joined ${pg.name}` : "Joined");
    },
  });

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-heading text-sm font-semibold text-heading">
          <MapPin className="size-4 text-primary" />
          Nearby PGs
        </h2>
        <Link href="/search" className="shrink-0 text-xs font-medium text-primary hover:underline">
          See all
        </Link>
      </div>

      <div className="space-y-2">
        {isLoading && <Skeleton className="h-16 w-full rounded-xl" />}
        {nearby?.slice(0, 1).map((pg, i) => (
          <PgListRow key={pg.id} pg={pg} tintIndex={i + 1} joining={joinMutation.isPending} onJoin={(id) => joinMutation.mutate(id)} />
        ))}
      </div>
    </div>
  );
}
