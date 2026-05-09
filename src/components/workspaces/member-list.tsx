"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMemberRole, removeMember } from "@/server/actions/workspace.actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { User, Shield, Eye, Crown, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { WorkspaceRole } from "@/types";

const ROLE_META: Record<WorkspaceRole, { label: string; Icon: React.ElementType; color: string }> =
  {
    owner: { label: "Owner", Icon: Crown, color: "text-amber-400" },
    admin: { label: "Admin", Icon: Shield, color: "text-blue-400" },
    member: { label: "Member", Icon: User, color: "text-foreground" },
    viewer: { label: "Viewer", Icon: Eye, color: "text-muted-foreground" },
  };

export function MemberList({
  members,
  workspaceSlug,
  currentUserId,
  isAdmin,
}: {
  members: {
    id: string;
    userId: string;
    role: WorkspaceRole;
    invitedBy: string | null;
    joinedAt: Date;
  }[];
  workspaceSlug: string;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRoleChange = async (memberId: string, role: WorkspaceRole) => {
    setLoading(memberId);
    const result = await updateMemberRole({ workspaceSlug, memberId, role });
    setLoading(null);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  };

  const handleRemove = async (memberId: string) => {
    setLoading(memberId);
    const result = await removeMember({ workspaceSlug, memberId });
    setLoading(null);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  };

  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No members yet.</p>;
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
      {members.map((member) => {
        const { label, Icon, color } = ROLE_META[member.role];
        const canManage = isAdmin && member.userId !== currentUserId && member.role !== "owner";
        return (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-xl border border-border/40 bg-card/40 px-5 py-4 transition-all hover:bg-card/60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
                {member.userId.charAt(0)}
              </div>
              <div>
                <p className="font-mono text-xs text-foreground/80">
                  {member.userId.slice(0, 12)}…
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canManage ? (
                <>
                  <Select
                    value={member.role}
                    onValueChange={(v) => handleRoleChange(member.id, v as WorkspaceRole)}
                    disabled={loading === member.id}
                  >
                    <SelectTrigger className="h-7 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin" className="text-xs">
                        Admin
                      </SelectItem>
                      <SelectItem value="member" className="text-xs">
                        Member
                      </SelectItem>
                      <SelectItem value="viewer" className="text-xs">
                        Viewer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(member.id)}
                    disabled={loading === member.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <span className={cn("flex items-center gap-1.5 text-xs font-medium", color)}>
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
