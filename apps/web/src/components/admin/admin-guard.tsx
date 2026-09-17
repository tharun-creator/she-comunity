"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/hooks";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminGuard({ children, fallback = null }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  
  const { data: isStaff, isLoading: staffLoading } = useQuery({
    queryKey: ["admin", "staff-check", user?.id],
    queryFn: async () => {
      if (!user) return false;
      try {
        const res = await apiClient.get<{ is_staff: boolean }>("/admin/check");
        return res.is_staff;
      } catch {
        return false;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!authLoading && !staffLoading) {
      if (!user || !isStaff) {
        router.push("/?error=unauthorized");
      }
    }
  }, [authLoading, staffLoading, user, isStaff, router]);

  if (authLoading || staffLoading) {
    return <>{fallback ?? <div className="flex h-64 items-center justify-center"><Skeleton className="h-8 w-48" /></div>}</>;
  }

  if (!user || !isStaff) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function useAdminAuth() {
  const { user } = useAuth();
  
  const { data: isStaff, isLoading } = useQuery({
    queryKey: ["admin", "staff-check", user?.id],
    queryFn: async () => {
      if (!user) return false;
      try {
        const res = await apiClient.get<{ is_staff: boolean }>("/admin/check");
        return res.is_staff;
      } catch {
        return false;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return { isStaff: isStaff ?? false, isLoading: isLoading || !user };
}