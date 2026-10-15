"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, MapPin, Plus, Search as SearchIcon, Star, Users, MessageSquare, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shestays/app-shell";
import { FilterPillBar } from "@/components/shestays/filter-pill-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchDiscoverFeed, searchPgs, createPg } from "@/lib/api/adapters";
import { CHENNAI_AREAS, type ChennaiArea, type Pg } from "@/types/domain";

const AREA_OPTIONS = ["All", ...CHENNAI_AREAS] as const;
type AreaFilter = (typeof AREA_OPTIONS)[number];

export default function SearchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<AreaFilter>("All");
  const [selectedPgId, setSelectedPgId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState<ChennaiArea>(CHENNAI_AREAS[0]);

  const { data: results, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchPgs(query),
    enabled: query.trim().length > 1,
  });

  const { data: discoveredPgs, isLoading: isDiscovering } = useQuery({
    queryKey: ["search-discover", area],
    queryFn: () => fetchDiscoverFeed(area),
  });

  const isSearching = query.trim().length > 1;
  const sourceResults = isSearching ? results : discoveredPgs;
  const visibleResults = (sourceResults ?? []).filter((pg) => area === "All" || pg.area === area);
  const selectedPg = visibleResults.find((pg) => pg.id === selectedPgId) ?? visibleResults[0] ?? null;
  const isLoadingResults = isSearching ? isFetching : isDiscovering;

  const createMutation = useMutation({
    mutationFn: () => createPg({ name: newName, area: newArea }),
    onSuccess: (pg) => {
      if (!pg) return;
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      queryClient.invalidateQueries({ queryKey: ["search-discover"] });
      toast.success("Your new community is ready", {
        description: `${pg.name} is ready for its first story.`,
      });
      setAddOpen(false);
      setNewName("");
      router.push(`/pg/${pg.id}`);
    },
  });

  const openCreatePg = (name: string) => {
    setNewName(name);
    setNewArea(area === "All" ? CHENNAI_AREAS[0] : area);
    setAddOpen(true);
  };

  return (
    <AppShell contentSize="wide">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Find a place and hear from residents</p>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-heading sm:text-3xl">Explore PG communities</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse honest reviews around Chennai.</p>
        </div>
        <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-medium text-body">
          <MapPin className="size-4 text-primary" /> Chennai
        </span>
      </header>

      <div className="mb-4 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <label htmlFor="pg-search" className="mb-2 block text-sm font-semibold text-heading">Search by name or area</label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="pg-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedPgId(null);
            }}
            placeholder="Try Sunrise Ladies PG or Velachery"
            className="pl-10"
            type="search"
          />
        </div>
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Browse by area</p>
          <FilterPillBar options={[...AREA_OPTIONS]} value={area} onChange={(nextArea) => {
            setArea(nextArea);
            setSelectedPgId(null);
          }} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.92fr)_minmax(340px,1.08fr)] lg:gap-5">
        <section aria-label="PG communities" className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-heading text-base font-semibold text-heading">{isSearching ? "Search results" : "Popular communities"}</h2>
            <span className="text-xs text-muted-foreground">
              {isLoadingResults ? "Finding communities…" : `${visibleResults.length} ${visibleResults.length === 1 ? "place" : "places"}`}
            </span>
          </div>

          <div className="space-y-2.5">
            {isLoadingResults && Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-2xl" />
            ))}

            {!isLoadingResults && visibleResults.map((pg) => (
              <div key={pg.id}>
                <button
                  type="button"
                  aria-pressed={selectedPg?.id === pg.id}
                  onClick={() => setSelectedPgId(pg.id)}
                  className={`w-full rounded-2xl border bg-card p-3 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-4 ${selectedPg?.id === pg.id ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/50"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-hover sm:size-16">
                      <Building2 className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate font-heading text-sm font-semibold text-heading sm:text-base">{pg.name}</h3>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" /> {pg.area}
                          </p>
                        </div>
                        {pg.aggregateRating != null && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2 py-1 text-xs font-semibold text-primary-hover">
                            <Star className="size-3 fill-current" /> {pg.aggregateRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MessageSquare className="size-3.5" /> {pg.reviewCount} reviews</span>
                        <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {pg.memberCount} residents</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs">
                    <span className="text-muted-foreground">{Object.keys(pg.tagAverages).length ? "Resident ratings available" : "Be the first to review"}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">Preview <ArrowUpRight className="size-3.5" /></span>
                  </div>
                </button>
                {selectedPg?.id === pg.id && (
                  <div className="mt-2 lg:hidden"><PgPreviewCard pg={pg} /></div>
                )}
              </div>
            ))}

            {!isLoadingResults && visibleResults.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-center sm:p-7">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <SearchIcon className="size-5" />
                </div>
                <h3 className="mt-3 font-heading font-semibold text-heading">
                  {isSearching ? `No PGs found for “${query}”` : "No communities in this area yet"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">Add a place you know and start its community.</p>
                <Button className="mt-4 gap-1.5" onClick={() => openCreatePg(query.trim())}>
                  <Plus className="size-4" /> Add this PG
                </Button>
              </div>
            )}
          </div>
        </section>

        <aside className="hidden min-w-0 lg:block" aria-label="Selected community details">
          {selectedPg ? <PgPreviewCard pg={selectedPg} /> : (
            <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <div>
                <Building2 className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 font-medium text-heading">Choose a community to preview</p>
                <p className="mt-1 text-sm text-muted-foreground">See resident ratings and community details here.</p>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new PG</DialogTitle>
            <DialogDescription>
              You&apos;ll become the founding member of this community. Chennai launch areas only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pg-name">PG name</Label>
              <Input id="pg-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Area</Label>
              <Select value={newArea} onValueChange={(v) => setNewArea(v as ChennaiArea)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHENNAI_AREAS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!newName.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? "Creating…" : "Create PG"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function PgPreviewCard({ pg }: { pg: Pg }) {
  const ratingEntries = Object.entries(pg.tagAverages).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-primary-soft sm:h-44">
        {pg.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- PG cover images are optional API content.
          <img src={pg.coverImageUrl} alt={`${pg.name} exterior`} className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-2xl border border-white/70 bg-white/70 text-primary-hover shadow-sm">
            <Building2 className="size-10" strokeWidth={1.5} />
          </div>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-heading shadow-sm">
          <MapPin className="mr-1 inline size-3.5 text-primary" /> {pg.area}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary">Community overview</p>
            <h2 className="mt-1 font-heading text-lg font-bold leading-tight text-heading sm:text-xl">{pg.name}</h2>
            {pg.address && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pg.address}</p>}
          </div>
          <div className="shrink-0 rounded-xl bg-primary-soft px-3 py-2 text-center text-primary-hover">
            <span className="flex items-center justify-center gap-1 font-heading text-lg font-bold">
              {pg.aggregateRating == null ? "—" : pg.aggregateRating.toFixed(1)}
              {pg.aggregateRating != null && <Star className="size-4 fill-current" />}
            </span>
            <span className="text-[11px]">{pg.aggregateRating == null ? "new" : "overall"}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-secondary/60 p-3">
            <p className="text-lg font-semibold text-heading">{pg.reviewCount}</p>
            <p className="text-xs text-muted-foreground">resident reviews</p>
          </div>
          <div className="rounded-xl bg-secondary/60 p-3">
            <p className="text-lg font-semibold text-heading">{pg.memberCount}</p>
            <p className="text-xs text-muted-foreground">community members</p>
          </div>
        </div>

        <section className="mt-4" aria-label="Resident ratings by category">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-heading">Resident ratings</h3>
            <span className="text-xs text-muted-foreground">out of 5</span>
          </div>
          {ratingEntries.length > 0 ? (
            <div className="space-y-2.5">
              {ratingEntries.slice(0, 4).map(([label, value]) => (
                <div key={label} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2 text-xs">
                  <span className="text-body">{label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(5, value ?? 0)) * 20}%` }} />
                  </span>
                  <span className="text-right font-medium text-heading">{(value ?? 0).toFixed(1)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">No ratings yet. Residents can share their experience here.</p>
          )}
        </section>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link href={`/pg/${pg.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            View community
          </Link>
          <Link href={`/pg/${pg.id}/compose`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-3 text-center text-sm font-medium text-heading hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Write a review
          </Link>
        </div>
      </div>
    </article>
  );
}
