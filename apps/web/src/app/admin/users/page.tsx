"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Ban, UserCheck, MoreHorizontal, Shield, UserX, Mail, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  auth_user_id: string;
  display_name: string;
  avatar_url?: string;
  city: string;
  phone_verified_at?: string;
  women_attested_at?: string;
  banned_at?: string;
  created_at: string;
  post_count: number;
  report_count: number;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users", search, statusFilter],
    queryFn: () => apiClient.get<User[]>(`/admin/users?search=${encodeURIComponent(search)}&status=${statusFilter}`),
  });

  const handleAction = async (userId: string, action: "ban" | "unban" | "verify" | "delete") => {
    try {
      await apiClient.post(`/admin/users/${userId}/action`, { action });
      setSelectedUser(null);
      window.location.reload();
    } catch (error) {
      alert("Action failed: " + error);
    }
  };

  const filteredUsers = users?.filter((u) => {
    if (search && !u.display_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === "active" && u.banned_at) return false;
    if (statusFilter === "banned" && !u.banned_at) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-heading">User Management</h1>
        <p className="text-muted-foreground">Manage platform users and moderation actions</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "banned")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Users {(filteredUsers ?? []).length !== undefined && <Badge variant="secondary">{(filteredUsers ?? []).length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border border-border p-4 h-20" />
              ))}
            </div>
          ) : (filteredUsers ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          ) : (
            <div className="space-y-3">
              {(filteredUsers ?? []).map((user) => (
                <UserRow key={user.id} user={user} onSelect={setSelectedUser} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <UserActionModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

function UserRow({ user, onSelect }: { user: User; onSelect: (u: User) => void }) {
  const isBanned = !!user.banned_at;
  const isVerified = !!user.women_attested_at;
  const isPhoneVerified = !!user.phone_verified_at;

  return (
    <button
      onClick={() => onSelect(user)}
      className={cn(
        "w-full text-left rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors",
        isBanned && "bg-destructive/5"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-hover font-medium text-sm">
          {user.display_name.split(" ").map((p) => p[0]).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.display_name}</p>
          <p className="text-sm text-muted-foreground truncate">{user.city}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {isBanned && <Badge variant="destructive">Banned</Badge>}
          {!isBanned && <Badge variant="default">Active</Badge>}
          {isVerified && <Badge variant="outline">Attested</Badge>}
          {isPhoneVerified && <Badge variant="secondary">Phone Verified</Badge>}
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Mail className="size-4 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
}

function UserActionModal({
  user,
  onClose,
  onAction,
}: {
  user: User;
  onClose: () => void;
  onAction: (id: string, action: "ban" | "unban" | "verify" | "delete") => void;
}) {
  const isBanned = !!user.banned_at;

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Actions</DialogTitle>
          <DialogDescription>Take moderation action on {user.display_name}</DialogDescription>
        </DialogHeader>

        <DialogContent className="py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">{user.display_name}</p>
            <p className="text-xs text-muted-foreground">Joined: {relativeTime(user.created_at)}</p>
            <p className="text-xs text-muted-foreground">Posts: {user.post_count} · Reports: {user.report_count}</p>
            <div className="flex gap-2 pt-2">
              {isBanned ? (
                <Badge variant="destructive">Banned since {relativeTime(user.banned_at!)}</Badge>
              ) : (
                <Badge variant="default">Active</Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            {isBanned ? (
              <Button className="w-full" variant="default" onClick={() => onAction(user.id, "unban")}>
                <UserCheck className="size-4 mr-2" />
                Unban User
              </Button>
            ) : (
              <Button className="w-full" variant="destructive" onClick={() => onAction(user.id, "ban")}>
                <UserX className="size-4 mr-2" />
                Ban User
              </Button>
            )}
            <Button className="w-full" variant="outline" onClick={() => onAction(user.id, "verify")}>
              <Shield className="size-4 mr-2" />
              Verify Identity
            </Button>
            <Button className="w-full" variant="outline" onClick={() => onAction(user.id, "delete")}>
              <Trash2 className="size-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function handleAction(userId: string, action: "ban" | "unban" | "verify" | "delete") {
  // This will be replaced by the actual handler
}