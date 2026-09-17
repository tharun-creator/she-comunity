"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Flag, Users, FileText, LogOut, Settings } from "lucide-react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/logs", label: "Moderation Logs", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard fallback={<div className="flex min-h-screen items-center justify-center">Access denied</div>}>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface/50 lg:flex lg:flex-col">
          <div className="flex h-14 items-center border-b border-border px-4">
            <h1 className="font-heading text-lg font-bold text-primary">SheStays Admin</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {ADMIN_NAV.map((item) => {
              const isActive = usePathname() === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-soft text-primary-hover"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-5" />
              Back to App
            </Link>
          </div>
        </aside>
        <main className="flex-1 min-w-0 lg:p-6">{children}</main>
      </div>
    </AdminGuard>
  );
}