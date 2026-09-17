"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchJoinedPgs, fetchDiscoverFeed } from "@/lib/api/adapters";
import type { Pg } from "@/types/domain";

export function PgPickerDialog({
  open,
  onOpenChange,
  isAnonymous,
  attachIntent = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAnonymous: boolean;
  attachIntent?: "image" | "link" | "poll" | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { data: joined } = useQuery({ queryKey: ["joined-pgs"], queryFn: fetchJoinedPgs, enabled: open });
  const { data: all } = useQuery({ queryKey: ["discover", "All"], queryFn: () => fetchDiscoverFeed("All"), enabled: open });

  const pool = [...(joined ?? []), ...((all ?? []).filter((p) => !joined?.some((j) => j.id === p.id)))];
  const filtered: Pg[] = query.trim()
    ? pool.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : pool;

  const goCompose = (pgId: string) => {
    onOpenChange(false);
    setQuery("");
    const params = new URLSearchParams();
    if (isAnonymous) params.set("anon", "1");
    if (attachIntent) params.set("attach", attachIntent);
    const qs = params.toString();
    router.push(`/pg/${pgId}/compose${qs ? `?${qs}` : ""}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Which PG is this about?</DialogTitle>
          <DialogDescription>Posts always belong to a specific PG&apos;s community.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your PGs"
            className="pl-9"
          />
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {filtered.map((pg) => (
            <button
              key={pg.id}
              type="button"
              onClick={() => goCompose(pg.id)}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
            >
              <span>
                <span className="font-medium text-heading">{pg.name}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{pg.area}</span>
              </span>
              {joined?.some((j) => j.id === pg.id) && (
                <span className="text-xs font-medium text-primary">Joined</span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-2.5 py-4 text-center text-sm text-muted-foreground">No PGs match.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
