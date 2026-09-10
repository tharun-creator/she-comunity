"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AuthorLine } from "./anonymous-tag";
import { VoteControl } from "./vote-control";
import { AnonymousToggle } from "./anonymous-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCommentsForPost, createComment, fetchProfile } from "@/lib/mock-data";
import type { Comment } from "@/types/domain";
import { relativeTime } from "@/lib/format";

export function CommentThread({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchCommentsForPost(postId),
  });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      createComment({
        postId,
        parentCommentId: null,
        body,
        author: isAnonymous
          ? { isAnonymous: true, anonymousTag: "Anonymous Resident" }
          : { isAnonymous: false, displayName: profile?.displayName ?? "You" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setBody("");
      toast.success("Comment posted");
    },
    onError: () => toast.error("Couldn't post your comment — try again."),
  });

  const tree = useMemo(() => {
    if (!comments) return [];
    const byParent = new Map<string | null, Comment[]>();
    for (const c of comments) {
      const list = byParent.get(c.parentCommentId) ?? [];
      list.push(c);
      byParent.set(c.parentCommentId, list);
    }
    return { byParent };
  }, [comments]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {profile && (
          <AnonymousToggle isAnonymous={isAnonymous} onChange={setIsAnonymous} displayName={profile.displayName} />
        )}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add to the discussion…"
          rows={3}
        />
        <div className="flex justify-end">
          <Button size="sm" disabled={!body.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Posting…" : "Comment"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {tree && "byParent" in tree
          ? (tree.byParent.get(null) ?? []).map((c) => (
              <CommentNode key={c.id} comment={c} byParent={tree.byParent} depth={0} />
            ))
          : null}
        {comments?.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet — be the first to reply.</p>
        )}
      </div>
    </div>
  );
}

function CommentNode({
  comment,
  byParent,
  depth,
}: {
  comment: Comment;
  byParent: Map<string | null, Comment[]>;
  depth: number;
}) {
  const [vote, setVote] = useState(comment.myVote);
  const [votes, setVotes] = useState({ up: comment.upvotes, down: comment.downvotes });
  const children = byParent.get(comment.id) ?? [];

  const handleVote = (next: 1 | -1 | 0) => {
    setVotes((v) => ({
      up: v.up + (next === 1 ? 1 : 0) - (vote === 1 ? 1 : 0),
      down: v.down + (next === -1 ? 1 : 0) - (vote === -1 ? 1 : 0),
    }));
    setVote(next);
  };

  return (
    <div className={depth > 0 ? "ml-4 border-l border-border pl-4 sm:ml-6 sm:pl-5" : ""}>
      <div className="flex gap-2.5">
        <VoteControl
          orientation="horizontal"
          size="sm"
          upvotes={votes.up}
          downvotes={votes.down}
          myVote={vote}
          onVote={handleVote}
        />
      </div>
      <div className="mt-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AuthorLine author={comment.author} />
          <span aria-hidden>·</span>
          <time dateTime={comment.createdAt}>{relativeTime(comment.createdAt)}</time>
        </div>
        <p className="mt-1 text-sm text-body">{comment.body}</p>
      </div>
      {children.length > 0 && (
        <div className="mt-3 space-y-3">
          {children.map((child) => (
            <CommentNode key={child.id} comment={child} byParent={byParent} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
