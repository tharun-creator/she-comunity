"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shestays/app-shell";
import { PostCard } from "@/components/shestays/post-card";
import { CommentThread } from "@/components/shestays/comment-thread";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPost } from "@/lib/api/adapters";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const { id, postId } = use(params);
  const { data: post, isLoading } = useQuery({ queryKey: ["post", postId], queryFn: () => fetchPost(postId) });

  return (
    <AppShell>
      <Link
        href={`/pg/${id}`}
        className="mb-3 inline-flex min-h-11 items-center gap-1 rounded-lg pr-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ArrowLeft className="size-3.5" />
        Back to community
      </Link>

      {isLoading && <Skeleton className="h-40 w-full rounded-2xl" />}
      {!isLoading && !post && <p className="text-sm text-muted-foreground">This post doesn&apos;t exist.</p>}
      {post && (
        <div className="space-y-5">
          <PostCard post={post} pgId={id} />
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 font-heading text-base font-semibold text-heading">
              Comments · {post.commentCount}
            </h2>
            <CommentThread postId={post.id} />
          </div>
        </div>
      )}
    </AppShell>
  );
}
