"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bell, User } from "lucide-react";
import { TopNav } from "./top-nav";
import { LeftSidebar } from "./left-sidebar";
import { MobilePostFab } from "./mobile-post-fab";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notifications", label: "Alerts", icon: Bell },
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
    <div className="flex min-h-screen w-full flex-col bg-[#FAF8F8]">
      <TopNav />

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 justify-center gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Left Sidebar matching user Mockup */}
        {!hideLeftSidebar && <LeftSidebar />}

        {/* Center content */}
        <main className={cn(
          "min-w-0 flex-1 pb-16 sm:pb-20 lg:pb-8",
          contentSize === "wide" ? "max-w-[1020px]" : "max-w-[680px] xl:max-w-[720px]"
        )}>
          {children}
        </main>

        {/* Right Sidebar matching user Mockup */}
        {rightSidebar && (
          <aside className="sticky top-20 hidden w-72 shrink-0 space-y-4 xl:block xl:w-80">
            {rightSidebar}
          </aside>
        )}
      </div>

      {(pathname === "/" || (pathname.startsWith("/pg/") && !pathname.includes("/compose"))) && (
        <MobilePostFab />
      )}

      {/* Mobile bottom tab bar */}
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 flex min-h-16 items-center justify-around border-t border-[#F0E6E8] bg-white px-2 py-1 shadow-sm lg:hidden">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1 text-xs font-bold transition-colors",
                active
                  ? "text-[#FF386B]"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("size-5", active && "text-[#FF386B]")} />
              <span className="text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
