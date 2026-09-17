"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X, ChevronDown, MoreHorizontal, Shield, Eye, Trash2, UserX, Mail } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ReportStatus = "pending" | "actioned" | "dismissed";
type ReportReason = "harassment" | "fake_review" | "doxxing" | "spam" | "other";

interface Report {
  id: string;
  reporter_id: string;
  target_type: "post" | "comment";
  target_id: string;
  reason: ReportReason;
  detail?: string;
  status: ReportStatus;
  resolved_by?: string;
  created_at: string;
  target_preview?: string;
  target_author?: string;
  pg_name?: string;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("pending");
  const [reasonFilter, setReasonFilter] = useState<ReportReason | "all">("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin", "reports", statusFilter, reasonFilter],
    queryFn: () => apiClient.get<Report[]>(`/admin/reports?status=${statusFilter}&reason=${reasonFilter}&limit=50`),
  });

  const handleAction = async (reportId: string, action: "hide" | "remove" | "dismiss" | "ban_user") => {
    try {
      await apiClient.patch(`/admin/reports/${reportId}`, { action });
      setSelectedReport(null);
      router.refresh();
    } catch (error) {
      alert("Action failed: " + error);
    }
  };

  const reasonLabels: Record<ReportReason, string> = {
    harassment: "Harassment or threats",
    fake_review: "Fake or misleading review",
    doxxing: "Doxxing (names a private individual)",
    spam: "Spam",
    other: "Other",
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-heading">Reports Queue</h1>
        <p className="text-muted-foreground">Review and moderate reported content</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReportStatus | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="actioned">Actioned</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reasonFilter} onValueChange={(v) => setReasonFilter(v as ReportReason | "all")}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              <SelectItem value="harassment">Harassment</SelectItem>
              <SelectItem value="fake_review">Fake Review</SelectItem>
              <SelectItem value="doxxing">Doxxing</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-5" />
            Reports {statusFilter !== "all" && <Badge variant="secondary">{statusFilter}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border border-border p-4 h-24" />
              ))}
            </div>
          ) : (reports ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No reports found</p>
          ) : (
            <div className="space-y-3">
              {(reports ?? []).map((report) => (
                <ReportRow key={report.id} report={report} onSelect={setSelectedReport} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

function ReportRow({ report, onSelect }: { report: Report; onSelect: (r: Report) => void }) {
  const statusColors: Record<ReportStatus, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    actioned: "bg-success/10 text-success border-success/20",
    dismissed: "bg-muted text-muted-foreground border-border",
  };

  return (
    <button
      onClick={() => onSelect(report)}
      className={cn(
        "w-full text-left rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors",
        "flex items-center justify-between gap-4"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={report.reason === "harassment" ? "destructive" : report.reason === "spam" ? "secondary" : "outline"}>
            {report.reason}
          </Badge>
          <Badge className={statusColors[report.status]}>{report.status}</Badge>
          <span className="text-xs text-muted-foreground">{report.target_type === "post" ? "Post" : "Comment"}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground truncate">{report.target_preview || "No preview"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          PG: {report.pg_name || "Unknown"} · {relativeTime(report.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Mail className="size-4 text-muted-foreground" />
      </div>
    </button>
  );
}

function ReportDetailModal({
  report,
  onClose,
  onAction,
}: {
  report: Report;
  onClose: () => void;
  onAction: (id: string, action: "hide" | "remove" | "dismiss" | "ban_user") => void;
}) {
  const [actionDetail, setActionDetail] = useState("");

  return (
    <Dialog open={!!report} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report Details</DialogTitle>
          <DialogDescription>Review the reported content and take action</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={report.reason === "harassment" ? "destructive" : "outline"}>{report.reason}</Badge>
            <Badge className={report.status === "pending" ? "bg-warning/10 text-warning" : "bg-muted"}>{report.status}</Badge>
            <span className="text-xs text-muted-foreground">{report.target_type}</span>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium mb-2">Reported Content Preview</p>
            <p className="text-sm text-body">{report.target_preview || "No preview available"}</p>
            <p className="mt-2 text-xs text-muted-foreground">Author: {report.target_author || "Anonymous"}</p>
            <p className="text-xs text-muted-foreground">PG: {report.pg_name || "Unknown"}</p>
          </div>

          {report.detail && (
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-sm font-medium mb-1">Reporter's Detail</p>
              <p className="text-sm text-body">{report.detail}</p>
            </div>
          )}

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium mb-2">Moderator Notes (optional)</p>
            <textarea
              value={actionDetail}
              onChange={(e) => setActionDetail(e.target.value)}
              placeholder="Internal notes for this action..."
              rows={3}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {report.status === "pending" && (
            <>
              <Button variant="outline" onClick={() => onAction(report.id, "dismiss")}>
                <X className="size-4 mr-2" />
                Dismiss
              </Button>
              <Button variant="secondary" onClick={() => onAction(report.id, "hide")}>
                <Shield className="size-4 mr-2" />
                Hide Content
              </Button>
              <Button variant="destructive" onClick={() => onAction(report.id, "remove")}>
                <Trash2 className="size-4 mr-2" />
                Remove Content
              </Button>
              <Button variant="destructive" onClick={() => onAction(report.id, "ban_user")}>
                <UserX className="size-4 mr-2" />
                Ban User
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}