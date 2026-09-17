"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, ArrowUpCircle, AtSign, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/shestays/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchNotifications } from "@/lib/api/adapters";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/domain";

const ICONS: Record<AppNotification["type"], typeof MessageSquare> = {
  reply: MessageSquare,
  upvote: ArrowUpCircle,
  mention: AtSign,
  report_resolved: ShieldCheck,
};

const LABELS: Record<AppNotification["type"], string> = {
  reply: "replied to",
  upvote: "upvoted",
  mention: "mentioned you in",
  report_resolved: "resolved your report on",
};

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  return (
    <AppShell>
      <header className="mb-4">
        <h1 className="font-heading text-xl font-bold text-heading">Notifications</h1>
      </header>

      <div className="space-y-2">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        {notifications?.map((n) => {
          const Icon = ICONS[n.type];
          return (
            <Link
              key={n.id}
              href={`/pg/${n.pgId}/post/${n.postId}`}
              className={cn(
                "flex items-start gap-3 rounded-xl border border-border p-3 transition-colors",
                n.isRead ? "bg-card" : "bg-primary-soft/50"
              )}
            >
              <Icon className={cn("mt-0.5 size-4.5 shrink-0", n.isRead ? "text-muted-foreground" : "text-primary")} />
              <div className="min-w-0">
                <p className="text-sm text-body">
                  Someone {LABELS[n.type]} your{" "}
                  {n.wasAnonymous ? <span className="text-anonymous font-medium">anonymous post</span> : "post"} in{" "}
                  <span className="font-medium text-heading">{n.pgName}</span>
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.postExcerpt}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(n.createdAt)}</p>
              </div>
            </Link>
          );
        })}
        {notifications?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        )}
      </div>
    </AppShell>
  );
}
