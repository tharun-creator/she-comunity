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
            "min-h-9 shrink-0 rounded-xl border-2 border-black px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer focus:outline-none",
            value === opt
              ? "bg-[#121212] text-white shadow-[2px_2px_0px_#000]"
              : "bg-white text-black shadow-[2px_2px_0px_#000] hover:bg-[#FFE5EC] hover:-translate-y-0.5 active:translate-y-0.5"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
