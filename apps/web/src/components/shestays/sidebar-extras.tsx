import Link from "next/link";
import { Bookmark, Clock } from "lucide-react";

export function SidebarExtras() {
  return (
    <div className="mt-4 space-y-0.5 border-t border-border pt-4">
      <Link
        href="/profile"
        className="flex min-h-11 items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-body hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Bookmark className="size-4 text-muted-foreground" />
        Saved Posts
      </Link>
      <Link
        href="/profile"
        className="flex min-h-11 items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-body hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Clock className="size-4 text-muted-foreground" />
        My Activity
      </Link>
    </div>
  );
}
