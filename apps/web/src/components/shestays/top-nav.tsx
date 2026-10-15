"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Bell, ChevronDown, HeartHandshake, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchNotifications, fetchProfile } from "@/lib/api/adapters";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Feed", trackActive: true },
  { href: "/search", label: "Find PGs", trackActive: true },
  { href: "/notifications", label: "Alerts", trackActive: true },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const { data: notifications } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-[2.5px] border-black bg-white px-4 shadow-[0_3px_0px_#000] sm:px-6">
      {/* Brand Logo with Neubrutalism Sticker Style */}
      <Link
        href="/"
        className="group flex items-center gap-2.5 rounded-xl border-2 border-black bg-[#FFE5EC] px-3 py-1.5 shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 focus:outline-none"
      >
        <span className="flex size-7 items-center justify-center rounded-lg border-2 border-black bg-[#FF4B72] text-white shadow-[1.5px_1.5px_0px_#000] transition-transform group-hover:rotate-[-8deg]">
          <HeartHandshake className="size-4" strokeWidth={2.5} />
        </span>
        <span className="font-heading text-base font-black tracking-tight text-black sm:text-lg">
          She<span className="text-[#FF4B72]">Stays</span>
        </span>
        <span className="hidden rounded border border-black bg-[#FFD23F] px-1 py-0.2 text-[9px] font-black uppercase text-black sm:inline">
          Women
        </span>
      </Link>

      {/* Center Nav Pills */}
      <nav aria-label="Main navigation" className="ml-6 hidden items-center gap-1.5 rounded-2xl border-2 border-black bg-[#FFFDF9] p-1 shadow-[2px_2px_0px_#000] md:flex">
        {NAV_LINKS.map((item) => {
          const active = item.trackActive && pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center rounded-xl px-4 py-1.5 text-xs font-black transition-all",
                active
                  ? "border-2 border-black bg-[#121212] text-white shadow-[1.5px_1.5px_0px_#000]"
                  : "text-black hover:bg-[#FFE5EC] hover:text-[#FF4B72]"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right Controls (Image 1 profile & action layout) */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => router.push("/search")}
          aria-label="Search"
          className="flex size-9 items-center justify-center rounded-xl border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
        >
          <Search className="size-4" />
        </button>

        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-xl border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border-2 border-black bg-[#FF4B72] text-[9px] font-black text-white">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User Pill from Image 1 Top Right */}
        <Link
          href="/profile"
          aria-label="Your profile"
          className="flex items-center gap-2 rounded-xl border-2 border-black bg-white px-2.5 py-1 text-black shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
        >
          <div className="size-6 overflow-hidden rounded-full border border-black bg-[#FFE5EC]">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-[#FFD23F] text-[10px] font-black text-black">
                {profile?.displayName
                  ? profile.displayName.split(" ").map((p) => p[0]).join("")
                  : "P"}
              </AvatarFallback>
            )}
          </div>
          <span className="hidden text-xs font-black text-black sm:inline truncate max-w-[90px]">
            {profile?.displayName ?? "Resident"}
          </span>
          <ChevronDown className="hidden size-3 text-black sm:block" />
        </Link>
      </div>
    </header>
  );
}
