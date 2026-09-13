import Link from "next/link";
import { Bookmark, Clock } from "lucide-react";

export function SidebarExtras() {
  return (
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
  );
}
