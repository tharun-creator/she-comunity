"use client";

import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ArrowRight, Building, MapPin } from "lucide-react";
import { toast } from "sonner";
import { fetchSuggestedPgs, fetchProfile, joinPg } from "@/lib/api/adapters";

const FALLBACK_RECOMMENDED = [
  { id: "pg-1", name: "OMR - Sholinganallur", members: "342 members" },
  { id: "pg-2", name: "Thoraipakkam", members: "256 members" },
  { id: "pg-3", name: "Nungambakkam", members: "198 members" },
  { id: "pg-4", name: "Velachery", members: "167 members" },
];

export function SuggestedPgsPanel() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const { data: suggested } = useQuery({
    queryKey: ["suggested-pgs", profile?.joinedPgIds],
    queryFn: () => fetchSuggestedPgs(profile?.joinedPgIds ?? []),
    enabled: !!profile,
  });

  const joinMutation = useMutation({
    mutationFn: (pgId: string) => joinPg(pgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["joined-pgs"] });
      toast.success("Joined community!");
    },
  });

  const displayList = (suggested && suggested.length > 0)
    ? suggested.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        members: `${p.memberCount} members`,
      }))
    : FALLBACK_RECOMMENDED;

  return (
    <div className="space-y-4">
      {/* Recommended for you Card matching Mockup */}
      <div className="rounded-2xl border border-[#F0E6E8] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3">
          <h3 className="flex items-center gap-1.5 font-heading text-sm font-bold text-gray-900">
            <Sparkles className="size-4 text-[#FF386B]" />
            Recommended for you
          </h3>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF386B] hover:underline"
          >
            See all <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="space-y-3">
          {displayList.map((item) => {
            const isJoined = profile?.joinedPgIds?.includes(item.id);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl p-1 transition-colors hover:bg-[#FAF8F8]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F3] text-[#FF386B]">
                    <Building className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-gray-900">{item.name}</p>
                    <p className="flex items-center gap-1 text-[11px] text-gray-400">
                      <MapPin className="size-3" /> {item.members}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => joinMutation.mutate(item.id)}
                  disabled={isJoined || joinMutation.isPending}
                  className="shrink-0 rounded-full bg-[#FF386B] px-3.5 py-1 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#E02657] active:scale-95 disabled:bg-gray-200 disabled:text-gray-500"
                >
                  {isJoined ? "Joined" : "Join"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Promo Banner in Right Sidebar matching Mockup */}
      <div className="relative overflow-hidden rounded-2xl border border-[#FCE4EC] bg-gradient-to-r from-[#FFF0F3] to-[#FFE8EE] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative size-16 shrink-0">
            <Image
              src="/illustrations/laptop-work.png"
              alt="Community"
              width={64}
              height={64}
              className="size-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-xs font-bold text-gray-800 leading-snug">
              Real women.
            </p>
            <p className="font-heading text-xs font-bold text-gray-800 leading-snug">
              Real stories.
            </p>
            <p className="font-heading text-xs font-black text-[#FF386B] leading-snug">
              A safer tomorrow. ❤️
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
