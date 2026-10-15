"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PgPickerDialog } from "./pg-picker-dialog";

export function MobilePostFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 flex min-h-12 items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:hidden"
      >
        <Plus className="size-4" />
        Create post
      </button>
      <PgPickerDialog open={open} onOpenChange={setOpen} isAnonymous={false} />
    </>
  );
}
