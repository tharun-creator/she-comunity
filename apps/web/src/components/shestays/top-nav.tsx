"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Bell, ChevronDown, HeartHandshake } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchNotifications, fetchProfile } from "@/lib/api/adapters";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home", trackActive: true },
  { href: "/search", label: "Search", trackActive: true },
  { href: "/notifications", label: "Notifications", trackActive: true },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const { data: notifications } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-surface/95 px-4 backdrop-blur-xl sm:px-6">
      <Link href="/" className="group flex min-h-11 items-center gap-2.5 rounded-full pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:rotate-[-6deg]">
          <HeartHandshake className="size-[18px]" strokeWidth={2} />
        </span>
        <span className="font-heading text-lg font-bold tracking-tight text-heading">She<span className="text-primary">Stays</span></span>
      </Link>

      <nav aria-label="Main navigation" className="ml-10 hidden items-center gap-1 rounded-full bg-secondary/60 p-1 lg:flex">
        {NAV_LINKS.map((item) => {
          const active = item.trackActive && pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active ? "bg-white text-primary-hover shadow-sm" : "text-muted-foreground hover:bg-white/70 hover:text-heading"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto hidden items-center gap-4 lg:flex">
        <button
          type="button"
          onClick={() => router.push("/search")}
          aria-label="Search"
          className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Search className="size-4.5" />
        </button>
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bell className="size-4.5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 size-2 rounded-full bg-danger ring-2 ring-surface" />
          )}
        </Link>
        <Link href="/profile" aria-label="Your profile" className="flex min-h-11 items-center gap-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary-hover">
              {profile?.displayName
                .split(" ")
                .map((p) => p[0])
                .join("") ?? "?"}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="hidden size-3.5 text-muted-foreground lg:block" />
        </Link>
      </div>
    </header>
  );
}
