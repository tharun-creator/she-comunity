"use client";

import Link from "next/link";
import { Star, Users, MessageSquare, ArrowUpRight, MapPin, ShieldCheck, Building2 } from "lucide-react";
import type { Pg } from "@/types/domain";
import { cn } from "@/lib/utils";

// Curated high quality hostel / PG architectural imagery fallbacks
const AREA_BG_STYLES: Record<string, { bg: string; accent: string; price: string }> = {
  "OMR-Sholinganallur": { bg: "from-rose-100 to-pink-200", accent: "bg-[#FF4B72]", price: "₹7,500/mo" },
  "Thoraipakkam": { bg: "from-amber-100 to-yellow-200", accent: "bg-[#FFD23F]", price: "₹7,800/mo" },
  "Nungambakkam": { bg: "from-emerald-100 to-teal-200", accent: "bg-[#05D5A4]", price: "₹12,000/mo" },
  "Velachery": { bg: "from-sky-100 to-blue-200", accent: "bg-[#3B82F6]", price: "₹8,500/mo" },
  "Anna Nagar": { bg: "from-violet-100 to-purple-200", accent: "bg-[#A78BFA]", price: "₹9,500/mo" },
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
  const meta = AREA_BG_STYLES[pg.area] ?? { bg: "from-pink-100 to-rose-200", accent: "bg-[#FF4B72]", price: "₹8,000/mo" };
  const safetyRating = pg.tagAverages?.Safety ?? (pg.aggregateRating ? pg.aggregateRating + 0.3 : null);

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border-[2.5px] border-black bg-white transition-all duration-150 cursor-pointer",
        isSelected
          ? "ring-2 ring-black -translate-x-1 -translate-y-1 shadow-[6px_6px_0px_#000]"
          : "shadow-[4px_4px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000]"
      )}
    >
      {/* Visual Header / Cover Image Area (Image 1 top card section) */}
      <div className={cn("relative h-44 w-full overflow-hidden border-b-2 border-black bg-gradient-to-br sm:h-48", meta.bg)}>
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#121212_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />

        {/* Big Building Icon Graphic */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 transition-transform duration-300 group-hover:scale-110">
          <Building2 className="size-24 text-black" />
        </div>

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg border-2 border-black bg-white px-2.5 py-1 text-xs font-black text-black shadow-[2px_2px_0px_#000]">
            <MapPin className="size-3 text-[#FF4B72]" />
            {pg.area}
          </span>
          {!pg.isPubliclyVisible && (
            <span className="rounded-lg border-2 border-black bg-[#FFD23F] px-2 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_#000]">
              Seed
            </span>
          )}
        </div>

        {/* Price Tag Sticker on Right */}
        <div className="absolute right-3 top-3">
          <span className="rounded-lg border-2 border-black bg-black px-2.5 py-1 text-xs font-black text-white shadow-[2px_2px_0px_#FFD23F]">
            {meta.price}
          </span>
        </div>

        {/* Safety Badge Sticker if high rating */}
        {safetyRating && safetyRating >= 4.0 && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-md border-1.5 border-black bg-[#05D5A4] px-2 py-0.5 text-[10px] font-black text-black shadow-[1.5px_1.5px_0px_#000]">
              <ShieldCheck className="size-3" /> Women Safety {safetyRating.toFixed(1)}/5
            </span>
          </div>
        )}
      </div>

      {/* Floating Info Section at Bottom (Image 1 Bottom Card Layout) */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-heading text-base font-black text-black transition-colors group-hover:text-[#FF4B72] sm:text-lg">
              {pg.name}
            </h3>
            {pg.aggregateRating != null && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border-2 border-black bg-[#FFD23F] px-2 py-0.5 text-xs font-black text-black shadow-[1.5px_1.5px_0px_#000]">
                <Star className="size-3.5 fill-black text-black" />
                {pg.aggregateRating.toFixed(1)}
              </span>
            )}
          </div>

          <p className="mt-1 flex items-center gap-1 text-xs font-bold text-gray-500">
            <MapPin className="size-3 shrink-0 text-gray-400" />
            {pg.address || `${pg.area}, Chennai`}
          </p>
        </div>

        {/* Host Avatar & Resident Stats Row with Circular Action Arrow Button */}
        <div className="mt-4 flex items-center justify-between border-t-2 border-black/10 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full border-2 border-black bg-[#FFE5EC] text-xs font-black text-[#FF4B72]">
              {pg.name.charAt(0)}
            </div>
            <div className="flex flex-col text-[11px] font-bold text-gray-700">
              <span className="flex items-center gap-1">
                <Users className="size-3 text-black" /> {pg.memberCount} residents
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                <MessageSquare className="size-2.5" /> {pg.reviewCount} stories
              </span>
            </div>
          </div>

          {/* Neubrutalist Arrow Button (From Image 1) */}
          <Link
            href={`/pg/${pg.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex size-9 items-center justify-center rounded-full border-2 border-black bg-[#FF4B72] text-white shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none"
            aria-label={`Open ${pg.name}`}
          >
            <ArrowUpRight className="size-4.5 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
