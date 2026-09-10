"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { VenetianMask, Plus } from "lucide-react";
import { PgPickerDialog } from "./pg-picker-dialog";
import { fetchProfile } from "@/lib/mock-data";

export function MobilePostFab() {
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-heading px-4 py-3 text-sm font-medium text-white shadow-lg lg:hidden"
      >
        <VenetianMask className="size-4" />
        Post as {profile?.displayName.split(" ")[0] ?? "…"}
        <Plus className="size-4" />
      </button>
      <PgPickerDialog open={open} onOpenChange={setOpen} isAnonymous={false} />
    </>
  );
}
