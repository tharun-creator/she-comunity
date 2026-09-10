"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bell, User } from "lucide-react";
import { Suspense } from "react";
import { TopNav } from "./top-nav";
import { QuickPostCard } from "./quick-post-card";
import { MyPgsList } from "./my-pgs-list";
import { MyCommunitiesList } from "./my-communities-list";
import { SidebarExtras } from "./sidebar-extras";
import { MobilePostFab } from "./mobile-post-fab";
import { OnboardingTour } from "./onboarding-tour";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppShell({
  children,
  rightSidebar,
  hideLeftSidebar = false,
}: {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  hideLeftSidebar?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <OnboardingTour />
      <TopNav />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 xl:px-6 2xl:px-10">
        {/* Desktop left utility panel: quick post + joined communities */}
        {!hideLeftSidebar && (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 flex-col overflow-y-auto scrollbar-hide p-4 xl:w-80 lg:flex">
            <QuickPostCard />
            <MyPgsList />
            <Suspense fallback={null}>
              <MyCommunitiesList />
            </Suspense>
            <SidebarExtras />
          </aside>
        )}

        {/* Center content */}
        <main className="min-w-0 flex-1 px-4 pb-24 pt-4 lg:px-6 lg:pb-8 lg:pt-6">
          <div className="mx-auto w-full max-w-[680px] lg:mx-0 xl:max-w-[760px]">{children}</div>
        </main>

        {/* Desktop right sidebar */}
        {rightSidebar && (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-80 shrink-0 overflow-y-auto scrollbar-hide border-l border-border p-4 xl:flex xl:flex-col xl:w-96">
            {rightSidebar}
          </aside>
        )}
      </div>

      <MobilePostFab />

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur lg:hidden">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
