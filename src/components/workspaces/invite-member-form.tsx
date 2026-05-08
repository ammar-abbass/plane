"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteMember } from "@/server/actions/workspace.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, UserPlus } from "lucide-react";

export function InviteMemberForm({ workspaceSlug }: { workspaceSlug: string }) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const result = await inviteMember({ workspaceSlug, userId, role });
    setLoading(false);
    if (result.success) {
      setSuccess(true);
      setUserId("");
      setRole("member");
      router.refresh();
    } else {
      setError(result.error.message);
    }
  };

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <p className="mb-3 text-sm font-medium">Invite member</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Clerk User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          className="flex-1 text-sm"
        />
        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
          <SelectTrigger className="h-9 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin" className="text-xs">Admin</SelectItem>
            <SelectItem value="member" className="text-xs">Member</SelectItem>
            <SelectItem value="viewer" className="text-xs">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={loading || !userId.trim()} className="gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          {loading ? "Inviting…" : "Invite"}
        </Button>
      </form>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      {success && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Member invited successfully.
        </p>
      )}
    </div>
  );
}
