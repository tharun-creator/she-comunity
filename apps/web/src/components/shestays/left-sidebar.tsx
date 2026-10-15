"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  FileText, 
  Bookmark, 
  Clock, 
  ChevronRight, 
  Pencil, 
  MapPin, 
  Plus 
} from "lucide-react";
import { fetchProfile } from "@/lib/api/adapters";
import { cn } from "@/lib/utils";

const COMMUNITY_ITEMS = [
  { name: "OMR - Sholinganallur", members: "342 members", area: "OMR-Sholinganallur" },
  { name: "Thoraipakkam", members: "256 members", area: "Thoraipakkam" },
  { name: "Nungambakkam", members: "198 members", area: "Nungambakkam" },
  { name: "Velachery", members: "167 members", area: "Velachery" },
];

export function LeftSidebar() {
  const pathname = usePathname();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const avatarSrc = profile?.avatarUrl || "/avatars/avatar-4.png";
  const displayName = profile?.displayName || "Priya Sharma";
  const username = "@" + (displayName.toLowerCase().replace(/\s+/g, "_") || "priya_s");

  const NAV_ITEMS = [
    { label: "Home", href: "/", icon: Home },
    { label: "My Posts", href: "/profile#posts", icon: FileText },
    { label: "Saved Posts", href: "/profile#saved", icon: Bookmark },
    { label: "My Activity", href: "/profile#activity", icon: Clock },
  ];

  return (
    <aside className="sticky top-20 hidden w-64 shrink-0 space-y-4 lg:flex lg:flex-col xl:w-72">
      {/* 1. Profile Mini Card matching Mockup */}
      <div className="rounded-2xl border border-[#F0E6E8] bg-white p-4 shadow-sm">
        <Link href="/profile" className="flex items-center gap-3 group">
          <div className="size-12 shrink-0 overflow-hidden rounded-full border-2 border-[#FFE8EE] bg-[#FFF0F3]">
            <Image
              src={avatarSrc}
              alt={displayName}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-heading text-sm font-bold text-gray-900 group-hover:text-[#FF386B] transition-colors">
              {displayName}
            </h3>
            <p className="truncate text-xs text-gray-500">{username}</p>
          </div>
          <ChevronRight className="size-4 text-gray-400 group-hover:text-[#FF386B] transition-colors" />
        </Link>

        <Link
          href="/profile"
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-full border border-[#FCE4EC] bg-[#FFF0F3] py-2 text-xs font-semibold text-[#FF386B] transition-colors hover:bg-[#FFE8EE]"
        >
          <Pencil className="size-3" />
          Update my profile
        </Link>
      </div>

      {/* 2. Navigation Menu matching Mockup */}
      <nav className="rounded-2xl border border-[#F0E6E8] bg-white p-2 shadow-sm space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all",
                active
                  ? "bg-[#FFE8EE] text-[#FF386B]"
                  : "text-gray-700 hover:bg-[#FAF8F8] hover:text-black"
              )}
            >
              <Icon className={cn("size-4", active ? "text-[#FF386B]" : "text-gray-500")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. My Communities matching Mockup */}
      <div className="rounded-2xl border border-[#F0E6E8] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3">
          <h4 className="font-heading text-xs font-bold text-gray-900">My Communities</h4>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF386B] hover:underline"
          >
            <Plus className="size-3" /> Join more
          </Link>
        </div>

        <div className="space-y-2.5">
          {COMMUNITY_ITEMS.map((item) => (
            <Link
              key={item.name}
              href={`/?area=${encodeURIComponent(item.area)}`}
              className="group flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-[#FAF8F8]"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FFE8EE] text-[#FF386B]">
                <MapPin className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-gray-900 group-hover:text-[#FF386B] transition-colors">
                  {item.name}
                </p>
                <p className="text-[11px] text-gray-400">{item.members}</p>
              </div>
              <ChevronRight className="size-3.5 text-gray-300 group-hover:text-[#FF386B] transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Bottom Promo Banner matching Mockup */}
      <div className="relative overflow-hidden rounded-2xl border border-[#FCE4EC] bg-[#FFF0F3] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative size-16 shrink-0">
            <Image
              src="/illustrations/coffee-relax.png"
              alt="Safe stay"
              width={64}
              height={64}
              className="size-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-xs font-black leading-snug text-gray-900">
              Safer Spaces,
            </p>
            <p className="font-heading text-xs font-black leading-snug text-[#FF386B]">
              Better Stays ❤️
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
