"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PgListRow } from "./pg-list-row";
import { fetchSuggestedPgs, fetchProfile, joinPg } from "@/lib/api/adapters";

export function SuggestedPgsPanel() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const { data: suggested, isLoading } = useQuery({
    queryKey: ["suggested-pgs", profile?.joinedPgIds],
    queryFn: () => fetchSuggestedPgs(profile?.joinedPgIds ?? []),
    enabled: !!profile,
  });

  const joinMutation = useMutation({
    mutationFn: (pgId: string) => joinPg(pgId),
    onSuccess: (_updated, pgId) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["joined-pgs"] });
      queryClient.invalidateQueries({ queryKey: ["suggested-pgs"] });
      const pg = suggested?.find((p) => p.id === pgId);
      toast.success(pg ? `Joined ${pg.name}` : "Joined");
    },
  });

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-sm font-semibold text-heading">PGs for you</h2>
          <p className="text-xs text-muted-foreground">Communities worth following in Chennai</p>
        </div>
        <Link href="/search" className="shrink-0 text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="space-y-2">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        {suggested?.slice(0, 3).map((pg, i) => (
          <PgListRow key={pg.id} pg={pg} tintIndex={i} joining={joinMutation.isPending} onJoin={(id) => joinMutation.mutate(id)} />
        ))}
      </div>
    </div>
  );
}
