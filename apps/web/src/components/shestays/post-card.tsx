"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, MoreHorizontal, Bookmark, Flag, BarChart3, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { AuthorLine } from "./anonymous-tag";
import { RatingTagChip } from "./rating-tag-chip";
import { ReportModal } from "./report-modal";
import { votePost, votePollOption, toggleSavePost } from "@/lib/mock-data";
import type { Post, RatingTag } from "@/types/domain";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format";

export function PostCard({ post, pgId }: { post: Post; pgId: string }) {
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const isLiked = post.myVote === 1;

  // Posts render from several differently-keyed queries at once (["posts", pgId, sort],
  // ["home-feed", area], ["post", postId] on the detail page) — patch every cache entry
  // that contains this post via setQueriesData's prefix match, not a single exact key,
  // otherwise the count only updates in whichever list happens to share that exact key.
  const patchPostEverywhere = (updater: (p: Post) => Post) => {
    queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
      old?.map((p) => (p.id === post.id ? updater(p) : p))
    );
    queryClient.setQueriesData<Post[]>({ queryKey: ["home-feed"] }, (old) =>
      old?.map((p) => (p.id === post.id ? updater(p) : p))
    );
    queryClient.setQueryData<Post>(["post", post.id], (old) => (old ? updater(old) : old));
  };

  // Only a like/unlike toggle is exposed in the UI (see DESIGN-SYSTEM.md) — the underlying
  // upvotes/downvotes model still exists server-side for moderation triage, downvoting just
  // isn't a first-class user action here.
  const likeMutation = useMutation({
    mutationFn: () => votePost(post.id, isLiked ? 0 : 1),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["home-feed"] });
      await queryClient.cancelQueries({ queryKey: ["post", post.id] });
      const next: 1 | 0 = isLiked ? 0 : 1;
      patchPostEverywhere((p) => ({ ...p, upvotes: p.upvotes + (next === 1 ? 1 : -1), myVote: next }));
    },
    onError: () => {
      patchPostEverywhere((p) => ({ ...p, upvotes: post.upvotes, myVote: post.myVote }));
      toast.error("Like didn't go through — try again.");
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => toggleSavePost(post.id),
    onSuccess: (updated) => {
      patchPostEverywhere(() => updated);
      toast.success(updated.isSaved ? "Saved" : "Removed from saved");
    },
  });

  const pollVoteMutation = useMutation({
    mutationFn: (optionId: string) => votePollOption(post.id, optionId),
    onMutate: async (optionId) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["home-feed"] });
      await queryClient.cancelQueries({ queryKey: ["post", post.id] });
      patchPostEverywhere((p) => ({
        ...p,
        myPollVote: optionId,
        pollOptions: p.pollOptions?.map((o) =>
          o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o
        ),
      }));
    },
    onError: () => {
      patchPostEverywhere((p) => ({ ...p, myPollVote: post.myPollVote, pollOptions: post.pollOptions }));
      toast.error("Vote didn't go through — try again.");
    },
  });

  const totalPollVotes = post.pollOptions?.reduce((sum, o) => sum + o.voteCount, 0) ?? 0;
  const roleLabel = post.author.isAnonymous ? "Anonymous" : post.residencyClaim ? "Resident" : null;

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback
            className={cn(
              "text-xs font-semibold",
              post.author.isAnonymous ? "bg-secondary text-anonymous" : "bg-primary-soft text-primary-hover"
            )}
          >
            {post.author.isAnonymous ? "?" : (post.author.displayName ?? "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <AuthorLine author={post.author} className="text-sm" />
          {roleLabel && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                post.author.isAnonymous ? "bg-anonymous/10 text-anonymous" : "bg-primary-soft text-primary-hover"
              )}
            >
              {roleLabel}
            </span>
          )}
          <span className="text-muted-foreground" aria-hidden>·</span>
          <time dateTime={post.createdAt} className="text-muted-foreground">
            {relativeTime(post.createdAt)}
          </time>
          {post.type !== "discussion" && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                post.type === "review" && "bg-primary-soft text-primary-hover",
                post.type === "poll" && "bg-secondary text-secondary-foreground"
              )}
            >
              {post.type === "review" ? "Review" : "Poll"}
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "ml-auto size-8 text-muted-foreground")}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-danger focus:text-danger">
              <Flag className="size-3.5" />
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link href={`/pg/${pgId}/post/${post.id}`} className="mt-2.5 block">
        <h3 className="font-heading text-base font-semibold text-heading hover:text-primary">{post.title}</h3>
      </Link>
      <p className="mt-1 line-clamp-3 text-sm text-body">{post.body}</p>

      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- client-side object URL, not an optimizable remote asset
        <img
          src={post.imageUrl}
          alt=""
          className="mt-2.5 max-h-80 w-full rounded-xl border border-border object-cover"
        />
      )}

      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm text-primary-hover hover:bg-secondary/70"
        >
          <Link2 className="size-3.5 shrink-0" />
          <span className="truncate">{post.linkUrl}</span>
        </a>
      )}

      {post.ratingTags && Object.keys(post.ratingTags).length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {Object.entries(post.ratingTags).map(([tag, value]) => (
            <RatingTagChip key={tag} tag={tag as RatingTag} value={value ?? 0} />
          ))}
        </div>
      )}

      {post.topics && post.topics.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {post.topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              #{topic}
            </span>
          ))}
        </div>
      )}

      {post.pollOptions && (
        <div className="mt-2.5 space-y-1.5">
          {post.pollOptions.map((opt) => {
            const pct = totalPollVotes ? Math.round((opt.voteCount / totalPollVotes) * 100) : 0;
            const isMyVote = post.myPollVote === opt.id;
            const hasVoted = Boolean(post.myPollVote);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={hasVoted || pollVoteMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  pollVoteMutation.mutate(opt.id);
                }}
                aria-pressed={isMyVote}
                className={cn(
                  "relative block w-full overflow-hidden rounded-lg border text-left",
                  isMyVote ? "border-primary" : "border-border",
                  !hasVoted && "cursor-pointer hover:border-primary/60"
                )}
              >
                {hasVoted && (
                  <div className="absolute inset-y-0 left-0 bg-primary-soft" style={{ width: `${pct}%` }} aria-hidden />
                )}
                <div className="relative flex items-center justify-between px-3 py-1.5 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    {isMyVote ? (
                      <Check className="size-3.5 text-primary" />
                    ) : (
                      <BarChart3 className="size-3.5 text-muted-foreground" />
                    )}
                    {opt.label}
                  </span>
                  {hasVoted && <span className="font-medium text-muted-foreground">{pct}%</span>}
                </div>
              </button>
            );
          })}
          {totalPollVotes > 0 && (
            <p className="px-0.5 text-xs text-muted-foreground">
              {totalPollVotes} vote{totalPollVotes === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-1 border-t border-border pt-2.5">
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 gap-1.5", isLiked ? "text-danger" : "text-muted-foreground")}
          onClick={() => likeMutation.mutate()}
          aria-pressed={isLiked}
        >
          <Heart className={cn("size-4", isLiked && "fill-current")} />
          {post.upvotes}
        </Button>
        <Link href={`/pg/${pgId}/post/${post.id}`}>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
            <MessageCircle className="size-4" />
            {post.commentCount}
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 gap-1.5", post.isSaved ? "text-primary" : "text-muted-foreground")}
          onClick={() => saveMutation.mutate()}
        >
          <Bookmark className={cn("size-4", post.isSaved && "fill-current")} />
          {post.isSaved ? "Saved" : "Save"}
        </Button>
      </div>

      <ReportModal open={reportOpen} onOpenChange={setReportOpen} targetType="post" targetId={post.id} />
    </article>
  );
}
