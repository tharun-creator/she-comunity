"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Navigation, Plus, Minus, Layers, ArrowUpRight, Star, Users, Building2 } from "lucide-react";
import type { Pg } from "@/types/domain";
import { cn } from "@/lib/utils";

// Coordinates mapped to percentage positions on Chennai SVG canvas
const AREA_COORDINATES: Record<string, { x: number; y: number; price: string }> = {
  "Anna Nagar": { x: 32, y: 22, price: "₹9.5k" },
  "Nungambakkam": { x: 44, y: 38, price: "₹12.0k" },
  "Velachery": { x: 46, y: 60, price: "₹8.5k" },
  "Thoraipakkam": { x: 58, y: 72, price: "₹7.8k" },
  "OMR-Sholinganallur": { x: 62, y: 88, price: "₹7.5k" },
};

interface ChennaiPgMapProps {
  pgs: Pg[];
  selectedPgId: string | null;
  onSelectPg: (pgId: string) => void;
  className?: string;
}

export function ChennaiPgMap({ pgs, selectedPgId, onSelectPg, className }: ChennaiPgMapProps) {
  const [zoom, setZoom] = useState(1);
  const [mapStyle, setMapStyle] = useState<"blueprint" | "metro">("blueprint");

  const selectedPg = pgs.find((p) => p.id === selectedPgId) ?? null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 1.6));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.8));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className={cn("relative flex h-[580px] w-full flex-col overflow-hidden rounded-2xl border-[2.5px] border-black bg-[#F4F1EA] shadow-[4px_4px_0px_#000]", className)}>
      {/* Map Header Bar */}
      <div className="z-10 flex items-center justify-between border-b-2 border-black bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg border-2 border-black bg-[#FFD23F] shadow-[1.5px_1.5px_0px_#000]">
            <Navigation className="size-3.5 fill-black text-black" />
          </span>
          <div>
            <h3 className="font-heading text-xs font-black uppercase tracking-wider text-black">Chennai PG Heatmap</h3>
            <p className="text-[10px] font-bold text-gray-600">5 Major Hostels & Tech Corridor Hubs</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMapStyle((s) => (s === "blueprint" ? "metro" : "blueprint"))}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-2.5 py-1 text-xs font-bold text-black shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
            title="Toggle map view"
          >
            <Layers className="size-3.5 text-black" />
            <span className="hidden sm:inline">{mapStyle === "blueprint" ? "Metro View" : "Blueprint"}</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative flex-1 cursor-grab overflow-hidden active:cursor-grabbing">
        <div
          className="relative h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
        >
          {/* Stylized Chennai Map Graphics */}
          <svg
            className="absolute inset-0 h-full w-full select-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Pattern for land grid */}
              <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E2DCD2" strokeWidth="0.5" />
              </pattern>
              {/* Coastline water pattern */}
              <pattern id="water-waves" width="20" height="10" patternUnits="userSpaceOnUse">
                <path d="M 0 5 Q 5 0, 10 5 T 20 5" fill="none" stroke="#B8E1DD" strokeWidth="0.8" />
              </pattern>
            </defs>

            {/* Mainland background with grid */}
            <rect width="100" height="100" fill="#FBF8F2" />
            <rect width="100" height="100" fill="url(#grid-pattern)" />

            {/* Bay of Bengal on East side */}
            <path
              d="M 76,0 Q 72,30 75,60 T 82,100 L 100,100 L 100,0 Z"
              fill={mapStyle === "blueprint" ? "#DDF4F2" : "#CCEFEB"}
              stroke="#05D5A4"
              strokeWidth="0.8"
            />
            <path
              d="M 76,0 Q 72,30 75,60 T 82,100 L 100,100 L 100,0 Z"
              fill="url(#water-waves)"
              opacity="0.6"
            />
            <text x="88" y="45" fill="#00A87E" fontSize="3" fontWeight="900" letterSpacing="0.1em" transform="rotate(90 88 45)">
              BAY OF BENGAL
            </text>

            {/* Arterial Roads / Tech Corridors */}
            {/* OMR (Old Mahabalipuram Road) */}
            <path
              d="M 52,48 L 58,70 L 62,88 L 65,100"
              fill="none"
              stroke="#FF4B72"
              strokeWidth="1.6"
              strokeDasharray="2,1"
            />
            <text x="63" y="76" fill="#121212" fontSize="2.4" fontWeight="800" transform="rotate(70 63 76)">
              OMR IT CORRIDOR
            </text>

            {/* GST Road / Ring Road */}
            <path
              d="M 28,15 Q 38,35 44,55 T 48,85"
              fill="none"
              stroke="#121212"
              strokeWidth="1.2"
            />

            {/* Inner Ring Road linking Anna Nagar to Velachery */}
            <path
              d="M 32,24 Q 40,42 46,60"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="1.4"
            />

            {/* Metro Line */}
            <path
              d="M 33,20 L 44,36 L 46,60"
              fill="none"
              stroke="#FFD23F"
              strokeWidth="1"
              strokeDasharray="1,1"
            />

            {/* Major Landmark Zones */}
            <rect x="26" y="16" width="15" height="12" rx="2" fill="#FFE5EC" stroke="#121212" strokeWidth="0.6" opacity="0.8" />
            <text x="33.5" y="21" textAnchor="middle" fill="#121212" fontSize="2.2" fontWeight="800">
              Anna Nagar
            </text>

            <rect x="38" y="32" width="16" height="13" rx="2" fill="#FEF3C7" stroke="#121212" strokeWidth="0.6" opacity="0.8" />
            <text x="46" y="37" textAnchor="middle" fill="#121212" fontSize="2.2" fontWeight="800">
              Nungambakkam
            </text>

            <rect x="39" y="54" width="16" height="13" rx="2" fill="#E0E7FF" stroke="#121212" strokeWidth="0.6" opacity="0.8" />
            <text x="47" y="59" textAnchor="middle" fill="#121212" fontSize="2.2" fontWeight="800">
              Velachery
            </text>

            <rect x="51" y="66" width="17" height="12" rx="2" fill="#D1FAE5" stroke="#121212" strokeWidth="0.6" opacity="0.8" />
            <text x="59.5" y="71" textAnchor="middle" fill="#121212" fontSize="2.2" fontWeight="800">
              Thoraipakkam
            </text>

            <rect x="54" y="82" width="19" height="14" rx="2" fill="#FCE7F3" stroke="#121212" strokeWidth="0.6" opacity="0.8" />
            <text x="63.5" y="87" textAnchor="middle" fill="#121212" fontSize="2.2" fontWeight="800">
              Sholinganallur
            </text>
          </svg>

          {/* Interactive Marker Pins */}
          {pgs.map((pg) => {
            const coords = AREA_COORDINATES[pg.area] ?? { x: 50, y: 50, price: "₹8.0k" };
            const isSelected = selectedPgId === pg.id;

            return (
              <div
                key={pg.id}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
              >
                {/* Ping ring for selected pin */}
                {isSelected && (
                  <span className="absolute -inset-2.5 animate-ping rounded-full bg-[#FF4B72]/40" />
                )}

                <button
                  type="button"
                  onClick={() => onSelectPg(pg.id)}
                  className={cn(
                    "group relative flex items-center gap-1.5 rounded-full border-2 border-black px-2.5 py-1 text-xs font-black shadow-[2.5px_2.5px_0px_#000] transition-all duration-150 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] focus:outline-none",
                    isSelected
                      ? "scale-110 bg-[#FF4B72] text-white ring-2 ring-black"
                      : "bg-white text-black hover:bg-[#FFD23F]"
                  )}
                >
                  <MapPin className={cn("size-3.5 shrink-0", isSelected ? "text-white" : "text-[#FF4B72]")} />
                  <span className="truncate max-w-[85px]">{pg.name.split(" ")[0]}</span>
                  {pg.aggregateRating ? (
                    <span className={cn(
                      "inline-flex items-center gap-0.5 rounded px-1 text-[10px]",
                      isSelected ? "bg-black text-white" : "bg-[#FFE5EC] text-black"
                    )}>
                      <Star className="size-2.5 fill-current text-[#FFD23F]" />
                      {pg.aggregateRating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-500">{coords.price}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Zoom & Controls */}
      <div className="absolute right-3 top-14 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex size-8 items-center justify-center rounded-lg border-2 border-black bg-white font-black text-black shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
          aria-label="Zoom in"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex size-8 items-center justify-center rounded-lg border-2 border-black bg-white font-black text-black shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
          aria-label="Zoom out"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          className="flex size-8 items-center justify-center rounded-lg border-2 border-black bg-[#FFD23F] font-black text-[10px] text-black shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
          aria-label="Reset zoom"
        >
          1x
        </button>
      </div>

      {/* Bottom Quick-Preview Card when a PG pin is selected */}
      {selectedPg && (
        <div className="absolute inset-x-3 bottom-3 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000]">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[#FFE5EC] text-[#FF4B72]">
                <Building2 className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate font-heading text-sm font-black text-black">{selectedPg.name}</h4>
                  {selectedPg.aggregateRating && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded border border-black bg-[#FFD23F] px-1.5 py-0.5 text-[10px] font-black text-black">
                      <Star className="size-3 fill-black text-black" />
                      {selectedPg.aggregateRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-1 text-xs font-semibold text-gray-600 truncate">
                  <MapPin className="size-3 shrink-0 text-[#FF4B72]" /> {selectedPg.area}
                </p>
                <div className="mt-1 flex items-center gap-3 text-[11px] font-bold text-gray-700">
                  <span>{selectedPg.reviewCount} reviews</span>
                  <span>•</span>
                  <span>{selectedPg.memberCount} residents</span>
                </div>
              </div>
            </div>

            <Link
              href={`/pg/${selectedPg.id}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-black bg-[#FF4B72] px-3.5 py-2 text-xs font-black text-white shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none"
            >
              Open <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
