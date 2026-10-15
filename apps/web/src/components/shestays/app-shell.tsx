"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bell, User } from "lucide-react";
import { Suspense } from "react";
import { TopNav } from "./top-nav";
import { MyPgsList } from "./my-pgs-list";
import { MyCommunitiesList } from "./my-communities-list";
import { SidebarExtras } from "./sidebar-extras";
import { MobilePostFab } from "./mobile-post-fab";
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
  contentSize = "standard",
}: {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  hideLeftSidebar?: boolean;
  contentSize?: "standard" | "wide";
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-clip">
      <TopNav />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 lg:gap-3 xl:px-6 2xl:px-10">
        {/* Desktop community rail */}
        {!hideLeftSidebar && (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto scrollbar-hide p-3 lg:flex xl:w-72">
            <MyPgsList />
            <Suspense fallback={null}>
              <MyCommunitiesList />
            </Suspense>
            <SidebarExtras />
          </aside>
        )}

        {/* Center content */}
        <main className="min-w-0 flex-1 px-3 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 lg:px-4 lg:pb-8 lg:pt-6">
          <div className={cn("mx-auto w-full lg:mx-auto", contentSize === "wide" ? "max-w-[1080px]" : "max-w-[680px]")}>
            {children}
          </div>
        </main>

        {/* Desktop right sidebar */}
        {rightSidebar && (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto scrollbar-hide border-l border-border p-4 xl:flex xl:flex-col 2xl:w-80">
            {rightSidebar}
          </aside>
        )}
      </div>

      {(pathname === "/" || (pathname.startsWith("/pg/") && !pathname.includes("/compose"))) && (
        <MobilePostFab />
      )}

      {/* Mobile bottom tab bar */}
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 flex min-h-16 gap-1 border-t-2 border-black bg-white px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-3px_0px_#000] lg:hidden">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-black transition-transform",
                active
                  ? "border-2 border-black bg-[#FFE5EC] text-[#FF4B72] shadow-[1.5px_1.5px_0px_#000]"
                  : "text-gray-600 hover:text-black"
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
