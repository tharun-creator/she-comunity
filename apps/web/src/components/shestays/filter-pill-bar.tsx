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
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer focus:outline-none",
              active
                ? "bg-[#FFE8EE] text-[#FF386B] border border-[#FCE4EC] shadow-xs"
                : "bg-white text-gray-600 border border-[#F0E6E8] hover:bg-[#FAF8F8] hover:text-gray-900"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
