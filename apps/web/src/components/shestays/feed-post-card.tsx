import Link from "next/link";
import { Users2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PostCard } from "./post-card";
import { AuthorLine } from "./anonymous-tag";
import type { FeedPost } from "@/lib/mock-data";

export function FeedPostCard({ post }: { post: FeedPost }) {
  return (
    <div>
      {post.isCommunityPost ? (
        <Link
          href={`/?area=${encodeURIComponent(post.pgArea)}`}
          className="mb-1.5 flex items-center gap-2 px-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-secondary">
            <Users2 className="size-3 text-secondary-foreground" />
          </span>
          <span className="font-medium text-heading">{post.pgArea} Community</span>
        </Link>
      ) : (
        <Link
          href={`/pg/${post.pgId}`}
          className="mb-1.5 flex items-center gap-2 px-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Avatar className="size-5">
            <AvatarFallback className="bg-primary-soft text-[9px] font-semibold text-primary-hover">
              {post.pgName
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-heading">{post.pgName}</span>
          <span aria-hidden>·</span>
          <span>{post.pgArea}</span>
        </Link>
      )}

      <PostCard post={post} pgId={post.pgId} />

      {post.topComment && (
        <Link
          href={`/pg/${post.pgId}/post/${post.id}`}
          className="mt-1.5 block rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 hover:bg-secondary/70"
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
