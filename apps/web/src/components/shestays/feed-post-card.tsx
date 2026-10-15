import Link from "next/link";
import { Users2, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PostCard } from "./post-card";
import { AuthorLine } from "./anonymous-tag";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/lib/mock-data";

export function FeedPostCard({ post, featured = false }: { post: FeedPost; featured?: boolean }) {
  return (
    <div className={cn(
      "overflow-hidden rounded-2xl border border-[#F0E6E8] bg-white shadow-sm transition-all hover:shadow-md",
      featured && "ring-1 ring-[#FF386B]/20"
    )}>
      {post.isCommunityPost ? (
        <Link
          href={`/?area=${encodeURIComponent(post.pgArea)}`}
          className="flex min-h-11 items-center gap-2.5 border-b border-[#F0E6E8] bg-[#FFF0F3] px-4 py-2 text-xs text-gray-900 transition-colors hover:bg-[#FFE8EE] focus:outline-none"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-[#FFE8EE] text-[#FF386B]">
            <Users2 className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-bold text-gray-900">{post.pgArea} Community</span>
            <span className="ml-2 text-[11px] text-gray-500">Conversation across local PGs</span>
          </span>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#FF386B] border border-[#FCE4EC]">
            Area Thread
          </span>
        </Link>
      ) : (
        <Link
          href={`/pg/${post.pgId}`}
          className="flex min-h-11 items-center gap-2.5 border-b border-[#F0E6E8] bg-[#FAF8F8] px-4 py-2 text-xs text-gray-900 transition-colors hover:bg-[#FFF0F3] focus:outline-none"
        >
          <Avatar className="size-6 border border-[#FFE8EE]">
            <AvatarFallback className="bg-[#FFE8EE] text-[10px] font-bold text-[#FF386B]">
              {post.pgName
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="truncate font-bold text-gray-900">{post.pgName}</span>
            <span className="ml-2 truncate text-[11px] text-gray-500">{post.pgArea}</span>
          </span>
          <span className="rounded-full bg-[#E6FBF5] px-2.5 py-0.5 text-[10px] font-bold text-[#05D5A4]">
            PG Community
          </span>
        </Link>
      )}

      <PostCard post={post} pgId={post.pgId} className="rounded-none border-0 bg-transparent p-4 shadow-none sm:p-5" />

      {post.topComment && (
        <Link
          href={`/pg/${post.pgId}/post/${post.id}`}
          className="mx-4 mb-4 block rounded-xl border border-[#F0E6E8] bg-[#FAF8F8] p-3 transition-colors hover:bg-[#FFF0F3]"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-900">
            <AuthorLine author={post.topComment.author} />
            <span className="text-gray-400">replied</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-600">{post.topComment.body}</p>
        </Link>
      )}
    </div>
  );
}
