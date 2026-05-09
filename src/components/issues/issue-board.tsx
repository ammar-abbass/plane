"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { updateIssue } from "@/server/actions/issue.actions";
import { cn } from "@/lib/cn";
import {
  CircleDot,
  Circle,
  Timer,
  Eye,
  CheckCircle2,
  Ban,
  AlertCircle,
  ArrowUp,
  Minus,
  ArrowDown,
  ChevronRight,
} from "lucide-react";
import type { IssueStatus, IssuePriority } from "@/types";

type Issue = {
  id: string;
  sequenceId: number;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: string | null;
  dueDate: Date | null | string;
  labels: { id: string; name: string; color: string }[];
};

const STATUS_COLUMNS: IssueStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
];

const STATUS_META: Record<IssueStatus, { label: string; Icon: React.ElementType; color: string }> =
  {
    backlog: { label: "Backlog", Icon: CircleDot, color: "text-slate-400" },
    todo: { label: "Todo", Icon: Circle, color: "text-blue-400" },
    in_progress: { label: "In Progress", Icon: Timer, color: "text-amber-400" },
    in_review: { label: "In Review", Icon: Eye, color: "text-violet-400" },
    done: { label: "Done", Icon: CheckCircle2, color: "text-emerald-400" },
    cancelled: { label: "Cancelled", Icon: Ban, color: "text-slate-500" },
  };

const PRIORITY_META: Record<
  IssuePriority,
  { label: string; Icon: React.ElementType; color: string }
> = {
  urgent: { label: "Urgent", Icon: AlertCircle, color: "text-red-400" },
  high: { label: "High", Icon: ArrowUp, color: "text-orange-400" },
  medium: { label: "Medium", Icon: Minus, color: "text-amber-400" },
  low: { label: "Low", Icon: ArrowDown, color: "text-blue-400" },
  none: { label: "None", Icon: Minus, color: "text-slate-500" },
};

function StatusIcon({ status, className }: { status: IssueStatus; className?: string }) {
  const { Icon, color } = STATUS_META[status];
  return <Icon className={cn("h-3.5 w-3.5 shrink-0", color, className)} />;
}

function PriorityIcon({ priority, className }: { priority: IssuePriority; className?: string }) {
  const { Icon, color } = PRIORITY_META[priority];
  return <Icon className={cn("h-3 w-3 shrink-0", color, className)} />;
}

function IssueCard({
  issue,
  workspaceSlug,
  projectId,
  onStatusChange,
}: {
  issue: Issue;
  workspaceSlug: string;
  projectId: string;
  onStatusChange: (id: string, status: IssueStatus) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleStatusChange = (newStatus: IssueStatus) => {
    setMenuOpen(false);
    startTransition(() => {
      onStatusChange(issue.id, newStatus);
    });
  };

  const isOverdue =
    issue.dueDate &&
    new Date(issue.dueDate) < new Date() &&
    issue.status !== "done" &&
    issue.status !== "cancelled";

  return (
    <div
      className={cn(
        "group relative rounded-[10px] border border-border/40 bg-card/40 p-3.5 transition-all duration-200",
        "hover:border-border/80 hover:bg-card/60 hover:shadow-md hover:-translate-y-[1px]",
        isPending && "opacity-60",
        menuOpen && "z-50"
      )}
    >
      {/* Priority + Title row */}
      <div className="flex items-start gap-2">
        <PriorityIcon priority={issue.priority} className="mt-0.5" />
        <Link
          href={`/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`}
          className="flex-1 text-sm font-medium leading-snug text-foreground hover:text-foreground/80 line-clamp-2"
        >
          {issue.title}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Footer row */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Sequence ID */}
          <span className="font-mono text-[10px] text-muted-foreground/60">
            #{issue.sequenceId}
          </span>

          {/* Labels */}
          {issue.labels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${label.color}22`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
          {issue.labels.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{issue.labels.length - 2}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Due date */}
          {issue.dueDate && (
            <span
              className={cn(
                "text-[10px]",
                isOverdue ? "text-red-400 font-medium" : "text-muted-foreground",
              )}
            >
              {new Date(issue.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}

          {/* Status button */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1 rounded-md border border-border/50 bg-muted/40 px-1.5 py-0.5",
                "text-[10px] font-medium transition-colors hover:bg-accent",
              )}
            >
              <StatusIcon status={issue.status} className="h-3 w-3" />
              <span className="text-muted-foreground">{STATUS_META[issue.status].label}</span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                  {STATUS_COLUMNS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent",
                        s === issue.status && "bg-accent/60",
                      )}
                    >
                      <StatusIcon status={s} />
                      <span>{STATUS_META[s].label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  issues,
  workspaceSlug,
  projectId,
  onStatusChange,
}: {
  status: IssueStatus;
  issues: Issue[];
  workspaceSlug: string;
  projectId: string;
  onStatusChange: (id: string, status: IssueStatus) => void;
}) {
  const { label } = STATUS_META[status];
  return (
    <div className="flex w-[300px] shrink-0 flex-col gap-2.5 max-h-full">
      {/* Column header */}
      <div className="flex items-center gap-2 rounded-lg px-2 py-1">
        <StatusIcon status={status} />
        <span className="text-xs font-semibold text-foreground/80">{label}</span>
        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-muted/60 px-1.5 text-[10px] font-medium text-muted-foreground">
          {issues.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto min-h-0 pb-2">
        {issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            onStatusChange={onStatusChange}
          />
        ))}
        {issues.length === 0 && (
          <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border/40 text-xs text-muted-foreground/50">
            No issues
          </div>
        )}
      </div>
    </div>
  );
}

export function IssueBoard({ issues }: { issues: Issue[] }) {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const projectId = params.projectId as string;
  const [optimistic, setOptimistic] = useState<Issue[]>(issues);

  useEffect(() => {
    setOptimistic(issues);
  }, [issues]);

  const handleStatusChange = async (issueId: string, status: IssueStatus) => {
    // Optimistic update
    setOptimistic((prev) => prev.map((i) => (i.id === issueId ? { ...i, status } : i)));
    const result = await updateIssue({ issueId, workspaceSlug, status });
    if (!result.success) {
      // Revert on failure
      setOptimistic(issues);
    }
  };

  const issuesByStatus = STATUS_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = optimistic.filter((i) => i.status === status);
      return acc;
    },
    {} as Record<IssueStatus, Issue[]>,
  );

  return (
    <div className="flex h-full gap-3 overflow-x-auto pb-4">
      {STATUS_COLUMNS.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          issues={issuesByStatus[status] ?? []}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
