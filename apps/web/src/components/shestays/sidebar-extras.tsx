import Link from "next/link";
import { Bookmark, Clock, ArrowRight } from "lucide-react";

export function SidebarExtras() {
  return (
    <>
      <div className="mt-4 space-y-0.5 border-t border-border pt-4">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-body hover:bg-muted"
        >
          <Bookmark className="size-4 text-muted-foreground" />
          Saved Posts
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-body hover:bg-muted"
        >
          <Clock className="size-4 text-muted-foreground" />
          My Activity
        </Link>
      </div>

      <Link
        href="/search"
        className="group mt-4 flex items-center gap-3 rounded-2xl border border-border bg-primary-soft p-4"
      >
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold text-heading">Better stays, stronger together</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Join communities, share experiences, support each other.
          </p>
        </div>
        <ArrowRight className="ml-auto size-4 shrink-0 text-primary-hover opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </>
  );
}
