"use client";

import { useState } from "react";
import { Search, MapPin, SlidersHorizontal, Map, LayoutGrid, Columns2, X, ChevronDown } from "lucide-react";
import { CHENNAI_AREAS, type ChennaiArea } from "@/types/domain";
import { cn } from "@/lib/utils";

export type ViewMode = "split" | "grid" | "map";

interface SearchFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedArea: string;
  onAreaChange: (area: string) => void;
  selectedBudget: string;
  onBudgetChange: (budget: string) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  totalCount: number;
}

const CATEGORIES = ["All Hostels", "Verified Women PGs", "Coliving & Workation", "Single Rooms"] as const;
const BUDGET_OPTIONS = ["All Budgets", "Under ₹8,000", "₹8,000 - ₹12,000", "₹12,000+"] as const;
const SORT_OPTIONS = [
  { label: "Highest Rated", value: "rating" },
  { label: "Most Residents", value: "residents" },
  { label: "Most Reviews", value: "reviews" },
  { label: "Newest Added", value: "newest" },
] as const;

export function SearchFilterBar({
  query,
  onQueryChange,
  selectedArea,
  onAreaChange,
  selectedBudget,
  onBudgetChange,
  selectedSort,
  onSortChange,
  viewMode,
  onViewModeChange,
  activeCategory,
  onCategoryChange,
  totalCount,
}: SearchFilterBarProps) {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  return (
    <div className="mb-6 space-y-4">
      {/* Category Pills (from Image 1 top bar) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={cn(
                "inline-flex shrink-0 items-center rounded-xl border-2 border-black px-4 py-2 text-xs font-black transition-all duration-150",
                isActive
                  ? "bg-[#121212] text-white shadow-[2px_2px_0px_#000]"
                  : "bg-white text-black shadow-[2px_2px_0px_#000] hover:bg-[#FFE5EC] hover:-translate-y-0.5 active:translate-y-0.5"
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Search Input & Controls (Image 1 Sub-header) */}
      <div className="flex flex-col gap-3 rounded-2xl border-[2.5px] border-black bg-white p-3 shadow-[4px_4px_0px_#000] sm:p-4 md:flex-row md:items-center">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search PG in Sholinganallur, Velachery, Anna Nagar..."
            className="w-full rounded-xl border-2 border-black bg-[#FFFDF9] py-2.5 pl-10 pr-10 text-sm font-bold text-black placeholder:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-[#FF4B72] focus:shadow-[2px_2px_0px_#000]"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-black"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filters Toggle Button */}
        <button
          type="button"
          onClick={() => setFilterMenuOpen((prev) => !prev)}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black px-4 py-2.5 text-xs font-black transition-transform shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5",
            filterMenuOpen ? "bg-[#FFD23F] text-black" : "bg-white text-black hover:bg-[#FFE5EC]"
          )}
        >
          <SlidersHorizontal className="size-4" />
          <span>Filters</span>
          <ChevronDown className={cn("size-3.5 transition-transform", filterMenuOpen && "rotate-180")} />
        </button>

        {/* View Mode Switcher: Grid vs Map vs Split (Image 1 right controls) */}
        <div className="flex items-center gap-1 rounded-xl border-2 border-black bg-[#F4F1EA] p-1 shadow-[2px_2px_0px_#000]">
          <button
            type="button"
            onClick={() => onViewModeChange("split")}
            className={cn(
              "hidden items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors lg:inline-flex",
              viewMode === "split"
                ? "border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "text-gray-600 hover:text-black"
            )}
            title="Split Grid & Map view"
          >
            <Columns2 className="size-3.5" />
            <span>Split</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors",
              viewMode === "grid"
                ? "border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "text-gray-600 hover:text-black"
            )}
            title="Grid view"
          >
            <LayoutGrid className="size-3.5" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("map")}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors",
              viewMode === "map"
                ? "border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000]"
                : "text-gray-600 hover:text-black"
            )}
            title="Map view"
          >
            <Map className="size-3.5" />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* Expandable Filter Details Row */}
      {filterMenuOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-150 grid gap-3 rounded-2xl border-2 border-black bg-[#FFFDF9] p-4 shadow-[3px_3px_0px_#000] sm:grid-cols-3">
          {/* Area Selector */}
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-black">Area / Location</label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#FF4B72]" />
              <select
                value={selectedArea}
                onChange={(e) => onAreaChange(e.target.value)}
                className="w-full appearance-none rounded-xl border-2 border-black bg-white py-2 pl-9 pr-8 text-xs font-bold text-black focus:outline-none focus:shadow-[2px_2px_0px_#000]"
              >
                <option value="All">All Chennai Areas</option>
                {CHENNAI_AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-black" />
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-black">Budget per Month</label>
            <div className="relative">
              <select
                value={selectedBudget}
                onChange={(e) => onBudgetChange(e.target.value)}
                className="w-full appearance-none rounded-xl border-2 border-black bg-white py-2 px-3 text-xs font-bold text-black focus:outline-none focus:shadow-[2px_2px_0px_#000]"
              >
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-black" />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-black">Sort Results</label>
            <div className="relative">
              <select
                value={selectedSort}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full appearance-none rounded-xl border-2 border-black bg-white py-2 px-3 text-xs font-bold text-black focus:outline-none focus:shadow-[2px_2px_0px_#000]"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-black" />
            </div>
          </div>
        </div>
      )}

      {/* Header Results Summary */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-heading text-lg font-black text-black">
          {selectedArea === "All" ? "Chennai PGs for Women" : `PGs in ${selectedArea}`}
        </h2>
        <span className="rounded-lg border-2 border-black bg-[#FFE5EC] px-2.5 py-0.5 text-xs font-black text-black shadow-[1.5px_1.5px_0px_#000]">
          {totalCount} {totalCount === 1 ? "community" : "communities"}
        </span>
      </div>
    </div>
  );
}
