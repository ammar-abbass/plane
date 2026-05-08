"use client";

import { cn } from "@/lib/cn";
import {
  Plus, ArrowLeftRight, User, Type, Calendar,
  Tag, MessageSquare, Trash2,
} from "lucide-react";
import type { ActivityAction } from "@/types";

const ACTION_CONFIG: Record<ActivityAction, {
  label: string;
  Icon: React.ElementType;
  iconClass: string;
}> = {
  "issue.created":          { label: "created the issue",   Icon: Plus,           iconClass: "text-emerald-400" },
  "issue.status_changed":   { label: "changed status",      Icon: ArrowLeftRight, iconClass: "text-blue-400" },
  "issue.priority_changed": { label: "changed priority",    Icon: ArrowLeftRight, iconClass: "text-amber-400" },
  "issue.assignee_changed": { label: "changed assignee",    Icon: User,           iconClass: "text-violet-400" },
  "issue.title_changed":    { label: "changed title",       Icon: Type,           iconClass: "text-slate-400" },
  "issue.due_date_changed": { label: "changed due date",    Icon: Calendar,       iconClass: "text-orange-400" },
  "label.added":            { label: "added label",         Icon: Tag,            iconClass: "text-pink-400" },
  "label.removed":          { label: "removed label",       Icon: Tag,            iconClass: "text-slate-400" },
  "comment.added":          { label: "added a comment",     Icon: MessageSquare,  iconClass: "text-cyan-400" },
  "comment.deleted":        { label: "deleted a comment",   Icon: Trash2,         iconClass: "text-red-400" },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

type Activity = {
  id: string;
  actorId: string;
  action: ActivityAction;
  fromValue: string | null;
  toValue: string | null;
  createdAt: Date;
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-xs text-muted-foreground">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, idx) => {
        const config = ACTION_CONFIG[activity.action];
        const isLast = idx === activities.length - 1;
        return (
          <div key={activity.id} className="flex gap-3">
            {/* Timeline line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted",
                )}
              >
                <config.Icon className={cn("h-3 w-3", config.iconClass)} />
              </div>
              {!isLast && <div className="mt-1 w-px flex-1 bg-border/60" />}
            </div>

            {/* Content */}
            <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium text-foreground/80 font-mono">
                  {activity.actorId.slice(0, 8)}…
                </span>
                <span className="text-xs text-muted-foreground">{config.label}</span>
                {activity.fromValue && activity.toValue && (
                  <>
                    <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium line-through text-muted-foreground">
                      {activity.fromValue}
                    </span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium">
                      {activity.toValue}
                    </span>
                  </>
                )}
                {!activity.fromValue && activity.toValue && activity.action !== "issue.created" && (
                  <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium">
                    {activity.toValue}
                  </span>
                )}
                <span className="ml-auto text-[10px] text-muted-foreground/50">
                  {timeAgo(activity.createdAt)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
