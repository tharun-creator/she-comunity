"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search as SearchIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shestays/app-shell";
import { PgCard } from "@/components/shestays/pg-card";
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
import { searchPgs, createPg } from "@/lib/api/adapters";
import { CHENNAI_AREAS, type ChennaiArea } from "@/types/domain";

export default function SearchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState<ChennaiArea>(CHENNAI_AREAS[0]);

  const { data: results, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchPgs(query),
    enabled: query.trim().length > 1,
  });

  const createMutation = useMutation({
    mutationFn: () => createPg({ name: newName, area: newArea }),
    onSuccess: (pg) => {
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      toast.success(`${pg.name} created — you're the founding member.`);
      setAddOpen(false);
      setNewName("");
      router.push(`/pg/${pg.id}`);
    },
  });

  return (
    <AppShell>
      <header className="mb-4">
        <h1 className="font-heading text-xl font-bold text-heading">Search a PG</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">By name, locality, or pincode.</p>
      </header>

      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Sunrise Ladies PG, or Sholinganallur"
          className="pl-9"
          autoFocus
        />
      </div>

      <div className="space-y-3">
        {query.trim().length > 1 && !isFetching && results?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">Can&apos;t find &quot;{query}&quot;.</p>
            <Button
              className="mt-3 gap-1.5"
              onClick={() => {
                setNewName(query);
                setAddOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add this PG
            </Button>
          </div>
        )}
        {results?.map((pg) => (
          <PgCard key={pg.id} pg={pg} />
        ))}
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
