"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Flag, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Stats {
  total_users: number;
  total_pgs: number;
  total_posts: number;
  total_reports: number;
  pending_reports: number;
  reports_last_24h: number;
}

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiClient.get<Stats>("/admin/stats"),
    refetchInterval: 30000,
  });

  const { data: recentReports } = useQuery({
    queryKey: ["admin", "recent-reports"],
    queryFn: () => apiClient.get<any[]>("/admin/reports?limit=10&status=pending"),
  });

  {!stats && !recentReports ? (
    <div className="animate-pulse space-y-6"><Card className="h-32" /><Card className="h-32" /></div>
  ) : (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-heading">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of platform health and moderation queue</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats?.total_users ?? 0} icon={Users} />
        <StatCard title="Total PGs" value={stats?.total_pgs ?? 0} icon={Flag} />
        <StatCard title="Total Posts" value={stats?.total_posts ?? 0} icon={Clock} />
        <StatCard title="Pending Reports" value={stats?.pending_reports ?? 0} icon={AlertCircle} variant="warning" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-warning" />
              Pending Reports ({stats?.pending_reports ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(recentReports ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending reports</p>
            ) : (
              <div className="space-y-3">
                {(recentReports ?? []).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={r.reason === "harassment" ? "destructive" : r.reason === "spam" ? "secondary" : "outline"}>
                        {r.reason}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{r.target_type === "post" ? "Post" : "Comment"}</p>
                        <p className="text-xs text-muted-foreground">{relativeTime(r.created_at)}</p>
                      </div>
                    </div>
                    <a href={`/admin/reports/${r.id}`} className="text-sm font-medium text-primary hover:underline">
                      Review
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-success" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/admin/reports" className="block rounded-lg border border-border p-3 text-sm hover:bg-muted">Review all reports</a>
            <a href="/admin/users" className="block rounded-lg border border-border p-3 text-sm hover:bg-muted">Manage users</a>
            <a href="/admin/logs" className="block rounded-lg border border-border p-3 text-sm hover:bg-muted">View moderation logs</a>
          </CardContent>
        </Card>
      </div>
    </div>
  )}
}

function StatCard({ title, value, icon: Icon, variant }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; variant?: "default" | "warning" }) {
  return (
    <Card className={variant === "warning" ? "border-warning/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", variant === "warning" ? "text-warning" : "text-muted-foreground")} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}