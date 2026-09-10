"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ADMIN_TABS = [
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/pgs", label: "PGs" },
  { href: "/admin/users", label: "Users" },
];

// Scoped dark surface: the "dark" class here activates the existing .dark
// theme tokens from globals.css (pink primary stays pink — see the .dark
// block's --primary mapping) only inside this subtree. The rest of the app
// stays on the light theme.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Link href="/admin/reports" className="font-heading text-lg font-bold text-primary">
            SheStays Admin
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Exit to app
          </Link>
        </div>

        <nav className="flex w-fit gap-1 rounded-full border border-border bg-card p-1">
          {ADMIN_TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                pathname === tab.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}

export function AdminStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-heading">{value}</p>
    </div>
  );
}
