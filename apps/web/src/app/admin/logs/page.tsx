"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, Search, ChevronDown, Clock, Shield, User, Trash2, Eye, MoreHorizontal } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModLog {
  id: string;
  action: "hide" | "remove" | "dismiss" | "ban_user" | "unban" | "verify";
  moderator_id: string;
  moderator_name: string;
  target_type: "post" | "comment" | "user";
  target_id: string;
  target_preview?: string;
  reason?: string;
  created_at: string;
}

export default function AdminLogsPage() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [moderatorFilter, setModeratorFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin", "logs", actionFilter, moderatorFilter, search],
    queryFn: () => apiClient.get<ModLog[]>(`/admin/logs?action=${actionFilter}&moderator=${moderatorFilter}&search=${encodeURIComponent(search)}&limit=100`),
  });

  const actionOptions = [
    { value: "all", label: "All Actions" },
    { value: "hide", label: "Hide" },
    { value: "remove", label: "Remove" },
    { value: "dismiss", label: "Dismiss" },
    { value: "ban_user", label: "Ban User" },
    { value: "unban", label: "Unban" },
    { value: "verify", label: "Verify" },
  ];

  const filteredLogs = (logs ?? []).filter((log) => {
    if (search && !log.target_preview?.toLowerCase().includes(search.toLowerCase()) && !log.moderator_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-heading">Moderation Logs</h1>
        <p className="text-muted-foreground">Audit trail of all moderation actions</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search moderator, target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </div>
          <Select value={actionFilter} onValueChange={(v) => setActionFilter(v ?? "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={moderatorFilter} onValueChange={(v) => setModeratorFilter(v ?? "all")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Moderator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Moderators</SelectItem>
              {/* Dynamic moderator list would be populated from API */}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Logs <Badge variant="secondary">{filteredLogs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border border-border p-4 h-20" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No logs found</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Time</th>
                    <th className="text-left p-3 text-xs font-medium text-muted_foreground uppercase">Moderator</th>
                    <th className="text-left p-3 text-xs font-medium text-muted_foreground uppercase">Action</th>
                    <th className="text-left p-3 text-xs font-medium text-muted_foreground uppercase">Target</th>
                    <th className="text-left p-3 text-xs font-medium text-muted_foreground uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="p-3 text-sm text-muted_foreground whitespace-nowrap">{relativeTime(log.created_at)}</td>
                      <td className="p-3 text-sm font-medium">{log.moderator_name}</td>
                      <td className="p-3">
                        <Badge variant={log.action === "remove" || log.action === "ban_user" ? "destructive" : log.action === "hide" ? "secondary" : "outline"}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm max-w-xs truncate">
                        <span className="font-medium capitalize">{log.target_type}</span>
                        <span className="text-muted_foreground ml-1">({log.target_id.slice(0, 8)}...)</span>
                      </td>
                      <td className="p-3 text-sm text-muted_foreground max-w-xs truncate">{log.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}