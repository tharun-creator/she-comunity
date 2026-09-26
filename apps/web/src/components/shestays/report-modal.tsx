"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { reportContent } from "@/lib/api/adapters";
import type { ReportReason } from "@/types/domain";
import { cn } from "@/lib/utils";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "harassment", label: "Harassment or threats" },
  { value: "fake_review", label: "Fake or misleading review" },
  { value: "doxxing", label: "Doxxing (names a private individual)" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

export function ReportModal({
  open,
  onOpenChange,
  targetType,
  targetId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "post" | "comment";
  targetId: string;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");

  const mutation = useMutation({
    mutationFn: () => reportContent({ targetType, targetId, reason: reason!, detail }),
    onSuccess: () => {
      toast.success("Report submitted. Our moderation team will review it.");
      onOpenChange(false);
      setReason(null);
      setDetail("");
    },
    onError: () => toast.error("Couldn't submit the report — try again."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report content</DialogTitle>
          <DialogDescription>
            Reports are reviewed by our moderation team. The person you&apos;re reporting will never
            see who reported them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <fieldset className="space-y-2">
            <legend className="sr-only">Reason</legend>
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors",
                  reason === r.value ? "border-primary bg-primary-soft" : "hover:bg-muted"
                )}
              >
                <input
                  type="radio"
                  name="report-reason"
                  className="accent-[var(--ss-primary)]"
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                {r.label}
              </label>
            ))}
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="report-detail">Additional detail (optional)</Label>
            <Textarea
              id="report-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Anything that helps our team review this faster"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Submitting…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
