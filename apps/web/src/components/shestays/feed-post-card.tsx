import Link from "next/link";
import { Users2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PostCard } from "./post-card";
import { AuthorLine } from "./anonymous-tag";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/lib/mock-data";

export function FeedPostCard({ post, featured = false }: { post: FeedPost; featured?: boolean }) {
  return (
    <div className={cn(
      "overflow-hidden rounded-[1.5rem] border border-border/80 bg-card shadow-[0_14px_34px_-30px_rgba(8,24,40,0.55)]",
      featured && "border-primary/20 shadow-[0_18px_42px_-30px_rgba(248,42,120,0.32)]"
    )}>
      {post.isCommunityPost ? (
        <Link
          href={`/?area=${encodeURIComponent(post.pgArea)}`}
          className="flex min-h-12 items-center gap-2.5 border-b border-border/70 bg-secondary/35 px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <Users2 className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-heading">{post.pgArea} community</span>
            <span className="mt-0.5 block text-[11px]">A conversation across nearby PGs</span>
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 font-medium text-primary-hover">Local voices</span>
        </Link>
      ) : (
        <Link
          href={`/pg/${post.pgId}`}
          className="flex min-h-12 items-center gap-2.5 border-b border-border/70 bg-secondary/35 px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary-hover">
              {post.pgName
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-heading">{post.pgName}</span>
            <span className="mt-0.5 block truncate">{post.pgArea}</span>
          </span>
          <span className="hidden rounded-full bg-white px-2.5 py-1 font-medium text-muted-foreground sm:inline-flex">Community</span>
        </Link>
      )}

      <PostCard post={post} pgId={post.pgId} className="rounded-none border-0 bg-transparent p-4 shadow-none sm:p-5" />

      {post.topComment && (
        <Link
          href={`/pg/${post.pgId}/post/${post.id}`}
          className="mx-3 mb-3 block rounded-2xl border border-border/70 bg-secondary/40 px-3.5 py-3 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:mx-4 sm:mb-4"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AuthorLine author={post.topComment.author} />
            <span>replied</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-body">{post.topComment.body}</p>
        </Link>
      )}
    </div>
  );
}
