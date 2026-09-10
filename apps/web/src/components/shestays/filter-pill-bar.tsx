"use client";

import { cn } from "@/lib/utils";

export function FilterPillBar<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible [scrollbar-width:none]">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer",
            value === opt
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-surface text-muted-foreground hover:bg-muted"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
