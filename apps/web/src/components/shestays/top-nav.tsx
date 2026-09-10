"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Bell, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchNotifications, fetchProfile } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// "Community" is the real feed route. "Home" points at the same destination for now
// (there's no distinct Home page yet) — rendered as a plain button rather than a second
// <Link href="/"> because two Links sharing one href trips Next's internal href-keyed
// dedup and logs a spurious duplicate-key warning.
const NAV_LINKS = [
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
    <header className="sticky top-0 z-30 hidden h-14 items-center border-b border-border bg-surface/95 px-6 backdrop-blur lg:flex">
      <Link href="/" className="font-heading text-lg font-bold text-primary">
        SheStays
      </Link>

      <nav className="ml-10 flex items-center gap-8">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="py-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Home
        </button>
        <Link
          href="/"
          className={cn(
            "relative py-4 text-sm font-medium transition-colors",
            pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Community
          {pathname === "/" && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
        </Link>
        {NAV_LINKS.map((item) => {
          const active = item.trackActive && pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative py-4 text-sm font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
              {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Log in
        </Link>
        <button
          type="button"
          onClick={() => router.push("/search")}
          aria-label="Search"
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Search className="size-4.5" />
        </button>
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-4.5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 size-2 rounded-full bg-danger ring-2 ring-surface" />
          )}
        </Link>
        <Link href="/profile" aria-label="Your profile" className="flex items-center gap-1">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary-hover">
              {profile?.displayName
                .split(" ")
                .map((p) => p[0])
                .join("") ?? "?"}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Link>
      </div>
    </header>
  );
}
