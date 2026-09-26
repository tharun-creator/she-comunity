"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthLoading, useUser } from "./hooks";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, fallback = null, redirectTo = "/auth/signin" }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const loading = useAuthLoading();
  const user = useUser();

  useEffect(() => {
    if (!loading && !user) {
      const redirectUrl = `${redirectTo}?next=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }, [loading, user, router, pathname, redirectTo]);

  if (loading) return <>{fallback}</>;
  if (!user) return <>{fallback}</>;

  return <>{children}</>;
}

interface PublicOnlyGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function PublicOnlyGuard({ children, fallback = null, redirectTo = "/" }: PublicOnlyGuardProps) {
  const router = useRouter();
  const loading = useAuthLoading();
  const user = useUser();

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  if (loading) return <>{fallback}</>;
  if (user) return <>{fallback}</>;

  return <>{children}</>;
}