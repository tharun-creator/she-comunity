"use client";

import Link from "next/link";
import { Star, Users, MessageSquare, ArrowUpRight, MapPin, ShieldCheck, Building2 } from "lucide-react";
import type { Pg } from "@/types/domain";
import { cn } from "@/lib/utils";

const AREA_BG_STYLES: Record<string, { bg: string; accent: string; price: string }> = {
  "OMR-Sholinganallur": { bg: "from-rose-50 to-pink-100", accent: "bg-[#FF386B]", price: "₹7,500/mo" },
  "Thoraipakkam": { bg: "from-amber-50 to-yellow-100", accent: "bg-[#F59E0B]", price: "₹7,800/mo" },
  "Nungambakkam": { bg: "from-emerald-50 to-teal-100", accent: "bg-[#05D5A4]", price: "₹12,000/mo" },
  "Velachery": { bg: "from-sky-50 to-blue-100", accent: "bg-[#3B82F6]", price: "₹8,500/mo" },
  "Anna Nagar": { bg: "from-violet-50 to-purple-100", accent: "bg-[#8B5CF6]", price: "₹9,500/mo" },
};

export function PgCard({
  pg,
  isSelected = false,
  onSelect,
}: {
  pg: Pg;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const meta = AREA_BG_STYLES[pg.area] ?? { bg: "from-pink-50 to-rose-100", accent: "bg-[#FF386B]", price: "₹8,000/mo" };
  const safetyRating = pg.tagAverages?.Safety ?? (pg.aggregateRating ? pg.aggregateRating + 0.3 : null);

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-[#F0E6E8] bg-white transition-all duration-150 cursor-pointer",
        isSelected
          ? "ring-2 ring-[#FF386B] shadow-md -translate-y-0.5"
          : "shadow-sm hover:shadow-md hover:-translate-y-0.5"
      )}
    >
      {/* Visual Header / Cover Image Area */}
      <div className={cn("relative h-40 w-full overflow-hidden border-b border-[#F0E6E8] bg-gradient-to-br sm:h-44", meta.bg)}>
        {/* Subtle Decorative Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#FF386B_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

        {/* Building Graphic */}
        <div className="absolute inset-0 flex items-center justify-center opacity-25 transition-transform duration-300 group-hover:scale-105">
          <Building2 className="size-20 text-gray-700" />
        </div>

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-xs px-2.5 py-1 text-xs font-bold text-gray-800 shadow-xs">
            <MapPin className="size-3 text-[#FF386B]" />
            {pg.area}
          </span>
          {!pg.isPubliclyVisible && (
            <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold uppercase text-[#78350F]">
              Seed
            </span>
          )}
        </div>

        {/* Price Tag Sticker on Right */}
        <div className="absolute right-3 top-3">
          <span className="rounded-full bg-gray-950 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
            {meta.price}
          </span>
        </div>

        {/* Safety Badge */}
        {safetyRating && safetyRating >= 4.0 && (
          <div className="absolute bottom-2.5 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E6FBF5] px-2.5 py-0.5 text-[11px] font-bold text-[#05D5A4] shadow-xs">
              <ShieldCheck className="size-3" /> Safety {safetyRating.toFixed(1)}/5
            </span>
          </div>
        )}
      </div>

      {/* Floating Info Section at Bottom */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-heading text-sm sm:text-base font-bold text-gray-900 transition-colors group-hover:text-[#FF386B]">
              {pg.name}
            </h3>
            {pg.aggregateRating != null && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-bold text-[#78350F]">
                <Star className="size-3 fill-[#F59E0B] text-[#F59E0B]" />
                {pg.aggregateRating.toFixed(1)}
              </span>
            )}
          </div>

          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="size-3 shrink-0 text-gray-400" />
            {pg.address || `${pg.area}, Chennai`}
          </p>
        </div>

        {/* Host Avatar & Resident Stats Row */}
        <div className="mt-3.5 flex items-center justify-between border-t border-[#F0E6E8] pt-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-[#FFE8EE] text-xs font-bold text-[#FF386B]">
              {pg.name.charAt(0)}
            </div>
            <div className="flex flex-col text-[11px] text-gray-600">
              <span className="font-semibold text-gray-800">
                {pg.memberCount} residents
              </span>
              <span className="text-[10px] text-gray-400">
                {pg.reviewCount} stories
              </span>
            </div>
          </div>

          <Link
            href={`/pg/${pg.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex size-8 items-center justify-center rounded-full bg-[#FF386B] text-white shadow-xs transition-transform hover:scale-105 active:scale-95"
            aria-label={`Open ${pg.name}`}
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
