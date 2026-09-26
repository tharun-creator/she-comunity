"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { VenetianMask, ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PgPickerDialog } from "./pg-picker-dialog";
import { fetchProfile } from "@/lib/api/adapters";
import { cn } from "@/lib/utils";

export function QuickPostCard() {
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg py-0.5 text-left hover:bg-muted">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary-hover">
              {profile?.displayName
                .split(" ")
                .map((p) => p[0])
                .join("") ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-heading">
            Post as {profile?.displayName ?? "…"}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setIsAnonymous(false)}>
            Post as {profile?.displayName ?? "yourself"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsAnonymous(true)}>
            <VenetianMask className="size-3.5 text-anonymous" />
            Post as Anonymous
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={() => setIsAnonymous((v) => !v)}
        className={cn(
          "mt-1 flex items-center gap-1 pl-[46px] text-xs hover:underline",
          isAnonymous ? "font-medium text-anonymous" : "text-muted-foreground"
        )}
      >
        <VenetianMask className="size-3" />
        {isAnonymous ? "Posting anonymously" : "Post anonymously"}
      </button>

      <Button className="mt-3 w-full gap-1.5" onClick={() => setPickerOpen(true)}>
        <Plus className="size-4" />
        Create post
      </Button>

      <PgPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} isAnonymous={isAnonymous} />
    </div>
  );
}
