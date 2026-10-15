"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Bell, ChevronDown, Heart } from "lucide-react";
import { fetchNotifications, fetchProfile } from "@/lib/api/adapters";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/notifications", label: "Notifications", hasBadge: true },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const { data: notifications } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const initials = profile?.displayName
    ? profile.displayName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "PS";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#F0E6E8] bg-white px-4 sm:px-8">
      {/* Brand Logo matching Mockup: Pink Heart Icon + SheStays */}
      <Link href="/" className="group flex items-center gap-2.5 focus:outline-none">
        <div className="flex size-9 items-center justify-center rounded-2xl bg-[#FF386B] text-white shadow-sm transition-transform group-hover:scale-105">
          <Heart className="size-5 fill-white stroke-none" />
        </div>
        <span className="font-heading text-xl font-black tracking-tight text-black">
          She<span className="text-[#FF386B]">Stays</span>
        </span>
      </Link>

      {/* Center Nav Pills matching Mockup */}
      <nav aria-label="Main navigation" className="hidden items-center gap-2 md:flex">
        {NAV_LINKS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center rounded-full px-5 py-1.5 text-sm font-semibold transition-all",
                active
                  ? "bg-[#FFE8EE] text-[#FF386B] font-bold"
                  : "text-gray-600 hover:text-black hover:bg-gray-50"
              )}
            >
              {item.label}
              {item.hasBadge && unreadCount > 0 && (
                <span className="ml-1.5 size-2 rounded-full bg-[#FF386B]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right Controls matching Mockup */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/search")}
          aria-label="Search"
          className="flex size-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-black"
        >
          <Search className="size-4.5" />
        </button>

        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-black"
        >
          <Bell className="size-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#FF386B]" />
          )}
        </Link>

        {/* User Profile Pill matching Mockup: 'PS' circle + dropdown chevron */}
        <Link
          href="/profile"
          aria-label="Your profile"
          className="flex items-center gap-1.5 rounded-full p-1 pl-1 pr-2 transition-colors hover:bg-gray-100"
        >
          <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-[#FFE8EE] text-xs font-bold text-[#FF386B]">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <ChevronDown className="size-3.5 text-gray-500" />
        </Link>
      </div>
    </header>
  );
}
