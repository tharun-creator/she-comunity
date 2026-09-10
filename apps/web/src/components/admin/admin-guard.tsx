"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "@/lib/mock-data";
import { isAdmin } from "@/lib/admin";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Skeleton className="h-32 w-full max-w-sm rounded-2xl" />
      </div>
    );
  }

  if (!isAdmin(profile?.id)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <h1 className="font-heading text-lg font-bold text-heading">Admins only</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This account doesn&apos;t have access to the admin panel.
        </p>
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          Back to SheStays
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
