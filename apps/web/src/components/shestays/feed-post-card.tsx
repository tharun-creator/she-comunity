import Link from "next/link";
import { Users2, MessageSquare, ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PostCard } from "./post-card";
import { AuthorLine } from "./anonymous-tag";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/lib/mock-data";

export function FeedPostCard({ post, featured = false }: { post: FeedPost; featured?: boolean }) {
  return (
    <div className={cn(
      "overflow-hidden rounded-2xl border-[2.5px] border-black bg-white shadow-[4px_4px_0px_#000] transition-all",
      featured && "shadow-[6px_6px_0px_#000] ring-1 ring-black"
    )}>
      {post.isCommunityPost ? (
        <Link
          href={`/?area=${encodeURIComponent(post.pgArea)}`}
          className="flex min-h-12 items-center gap-2.5 border-b-2 border-black bg-[#FFE5EC] px-4 py-2.5 text-xs text-black transition-colors hover:bg-[#FFD23F] focus:outline-none"
        >
          <span className="flex size-7 items-center justify-center rounded-lg border-2 border-black bg-white text-[#FF4B72] shadow-[1px_1px_0px_#000]">
            <Users2 className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-black text-black">{post.pgArea} Community</span>
            <span className="block text-[11px] font-bold text-gray-600">Conversation across local PGs</span>
          </span>
          <span className="rounded-lg border-2 border-black bg-white px-2 py-0.5 text-[10px] font-black uppercase text-black shadow-[1px_1px_0px_#000]">
            Area Thread
          </span>
        </Link>
      ) : (
        <Link
          href={`/pg/${post.pgId}`}
          className="flex min-h-12 items-center gap-2.5 border-b-2 border-black bg-[#FFFDF9] px-4 py-2.5 text-xs text-black transition-colors hover:bg-[#FFE5EC] focus:outline-none"
        >
          <Avatar className="size-7 border-2 border-black">
            <AvatarFallback className="bg-[#FFD23F] text-[10px] font-black text-black">
              {post.pgName
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-black text-black">{post.pgName}</span>
            <span className="block truncate text-[11px] font-bold text-gray-500">{post.pgArea}</span>
          </span>
          <span className="rounded-lg border-2 border-black bg-[#05D5A4] px-2 py-0.5 text-[10px] font-black uppercase text-black shadow-[1px_1px_0px_#000]">
            PG Community
          </span>
        </Link>
      )}

      <PostCard post={post} pgId={post.pgId} className="rounded-none border-0 bg-transparent p-4 shadow-none sm:p-5" />

      {post.topComment && (
        <Link
          href={`/pg/${post.pgId}/post/${post.id}`}
          className="mx-3 mb-3 block rounded-xl border-2 border-black bg-[#F4F1EA] p-3 shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 sm:mx-4 sm:mb-4"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-black">
            <AuthorLine author={post.topComment.author} />
            <span className="text-gray-500">replied</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs font-bold text-gray-800">{post.topComment.body}</p>
        </Link>
      )}
    </div>
  );
}
