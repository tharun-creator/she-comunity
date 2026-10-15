"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, MapPin, Plus, Search as SearchIcon, Star, Users, MessageSquare, ArrowUpRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shestays/app-shell";
import { PgCard } from "@/components/shestays/pg-card";
import { ChennaiPgMap } from "@/components/shestays/chennai-pg-map";
import { SearchFilterBar, type ViewMode } from "@/components/shestays/search-filter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchDiscoverFeed, searchPgs, createPg } from "@/lib/api/adapters";
import { CHENNAI_AREAS, type ChennaiArea, type Pg } from "@/types/domain";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Search & Filter State
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<string>("All");
  const [budget, setBudget] = useState<string>("All Budgets");
  const [sort, setSort] = useState<string>("rating");
  const [category, setCategory] = useState<string>("All Hostels");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [selectedPgId, setSelectedPgId] = useState<string | null>(null);

  // Add PG Modal State
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState<ChennaiArea>(CHENNAI_AREAS[0]);

  // Queries
  const { data: results, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchPgs(query),
    enabled: query.trim().length > 1,
  });

  const { data: discoveredPgs, isLoading: isDiscovering } = useQuery({
    queryKey: ["search-discover", area],
    queryFn: () => fetchDiscoverFeed(area === "All" ? "All" : (area as ChennaiArea)),
  });

  const isSearching = query.trim().length > 1;
  const sourceResults = isSearching ? results : discoveredPgs;

  // Filter & Sort Results
  let visibleResults = (sourceResults ?? []).filter((pg) => area === "All" || pg.area === area);

  if (sort === "rating") {
    visibleResults = [...visibleResults].sort((a, b) => (b.aggregateRating ?? 0) - (a.aggregateRating ?? 0));
  } else if (sort === "residents") {
    visibleResults = [...visibleResults].sort((a, b) => b.memberCount - a.memberCount);
  } else if (sort === "reviews") {
    visibleResults = [...visibleResults].sort((a, b) => b.reviewCount - a.reviewCount);
  }

  const isLoadingResults = isSearching ? isFetching : isDiscovering;

  const createMutation = useMutation({
    mutationFn: () => createPg({ name: newName, area: newArea }),
    onSuccess: (pg) => {
      if (!pg) return;
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      queryClient.invalidateQueries({ queryKey: ["search-discover"] });
      toast.success("Community Created", {
        description: `${pg.name} is ready for its first resident review.`,
      });
      setAddOpen(false);
      setNewName("");
      router.push(`/pg/${pg.id}`);
    },
  });

  const openCreatePg = (initialName: string) => {
    setNewName(initialName);
    setNewArea(area === "All" ? CHENNAI_AREAS[0] : (area as ChennaiArea));
    setAddOpen(true);
  };

  return (
    <AppShell contentSize="wide">
      {/* Top Hero Sticker Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#FFD23F] px-2.5 py-1 text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_#000]">
            <Sparkles className="size-3.5 fill-black text-black" />
            Verified Women Hostels & PGs
          </div>
          <h1 className="mt-2 font-heading text-2xl font-black tracking-tight text-black sm:text-4xl">
            Explore Chennai PG Communities
          </h1>
          <p className="mt-1 text-sm font-bold text-gray-600">
            Real resident stories, verified safety tags, and honest community ratings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreatePg(query)}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#FF4B72] px-4 py-2.5 text-xs font-black text-white shadow-[3px_3px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000]"
        >
          <Plus className="size-4 stroke-[3]" /> Add A PG
        </button>
      </div>

      {/* Neubrutalism Search & Filter Controls (Image 1 Layout) */}
      <SearchFilterBar
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          setSelectedPgId(null);
        }}
        selectedArea={area}
        onAreaChange={(a) => {
          setArea(a);
          setSelectedPgId(null);
        }}
        selectedBudget={budget}
        onBudgetChange={setBudget}
        selectedSort={sort}
        onSortChange={setSort}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeCategory={category}
        onCategoryChange={setCategory}
        totalCount={visibleResults.length}
      />

      {/* Discovery Content Area: Split, Grid, or Map */}
      {viewMode === "split" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: PG Cards (7 cols) */}
          <section className="lg:col-span-7">
            {isLoadingResults ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 w-full rounded-2xl border-2 border-black" />
                ))}
              </div>
            ) : visibleResults.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleResults.map((pg) => (
                  <PgCard
                    key={pg.id}
                    pg={pg}
                    isSelected={selectedPgId === pg.id}
                    onSelect={() => setSelectedPgId(pg.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-[2.5px] border-black bg-white p-8 text-center shadow-[4px_4px_0px_#000]">
                <div className="flex size-14 items-center justify-center rounded-2xl border-2 border-black bg-[#FFE5EC] text-[#FF4B72] shadow-[2px_2px_0px_#000]">
                  <SearchIcon className="size-7" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-black text-black">
                  {isSearching ? `No PGs found for “${query}”` : "No communities listed in this area"}
                </h3>
                <p className="mt-1 max-w-sm text-xs font-bold text-gray-600">
                  Know a PG in {area === "All" ? "Chennai" : area}? Be the first to start its community page!
                </p>
                <button
                  type="button"
                  onClick={() => openCreatePg(query)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#FFD23F] px-4 py-2 text-xs font-black text-black shadow-[2.5px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5"
                >
                  <Plus className="size-4" /> Add this PG now
                </button>
              </div>
            )}
          </section>

          {/* Right Column: Sticky Chennai Map (5 cols) */}
          <aside className="lg:col-span-5">
            <div className="sticky top-20">
              <ChennaiPgMap
                pgs={visibleResults}
                selectedPgId={selectedPgId}
                onSelectPg={(id) => {
                  setSelectedPgId(id);
                }}
              />
            </div>
          </aside>
        </div>
      )}

      {viewMode === "grid" && (
        <section>
          {isLoadingResults ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl border-2 border-black" />
              ))}
            </div>
          ) : visibleResults.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleResults.map((pg) => (
                <PgCard
                  key={pg.id}
                  pg={pg}
                  isSelected={selectedPgId === pg.id}
                  onSelect={() => setSelectedPgId(pg.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-[2.5px] border-black bg-white p-8 text-center shadow-[4px_4px_0px_#000]">
              <SearchIcon className="size-8 text-gray-400" />
              <h3 className="mt-3 font-heading text-lg font-black text-black">No PGs found</h3>
              <button
                type="button"
                onClick={() => openCreatePg(query)}
                className="mt-4 rounded-xl border-2 border-black bg-[#FFD23F] px-4 py-2 text-xs font-black text-black shadow-[2px_2px_0px_#000]"
              >
                Add PG
              </button>
            </div>
          )}
        </section>
      )}

      {viewMode === "map" && (
        <section className="h-[680px]">
          <ChennaiPgMap
            pgs={visibleResults}
            selectedPgId={selectedPgId}
            onSelectPg={(id) => setSelectedPgId(id)}
            className="h-full"
          />
        </section>
      )}

      {/* Neubrutalism Add PG Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl border-[3px] border-black bg-[#FFFDF9] p-6 shadow-[6px_6px_0px_#000]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-black text-black">Add New PG Community</DialogTitle>
            <DialogDescription className="text-xs font-bold text-gray-600">
              Start a community for women residents to share authentic experiences and safety ratings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <label htmlFor="pg-name" className="mb-1.5 block text-xs font-black uppercase tracking-wider text-black">
                PG Name
              </label>
              <input
                id="pg-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Sunrise Ladies Hostel"
                className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-bold text-black focus:outline-none focus:shadow-[3px_3px_0px_#000]"
              />
            </div>

            <div>
              <label htmlFor="pg-area" className="mb-1.5 block text-xs font-black uppercase tracking-wider text-black">
                Chennai Area
              </label>
              <select
                id="pg-area"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value as ChennaiArea)}
                className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-bold text-black focus:outline-none focus:shadow-[3px_3px_0px_#000]"
              >
                {CHENNAI_AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-xl border-2 border-black bg-white px-4 py-2 text-xs font-black text-black shadow-[2px_2px_0px_#000] hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!newName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#FF4B72] px-5 py-2 text-xs font-black text-white shadow-[2.5px_2.5px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Community"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
