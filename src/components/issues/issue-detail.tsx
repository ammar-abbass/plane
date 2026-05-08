"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateIssue, addComment, updateComment, deleteComment, deleteIssue,
} from "@/server/actions/issue.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ActivityFeed } from "@/components/activity/activity-feed";
import {
  CircleDot, Circle, Timer, Eye, CheckCircle2, Ban,
  AlertCircle, ArrowUp, Minus, ArrowDown,
  Calendar, Trash2, Pencil, Check, X, MessageSquare, User,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { IssueStatus, IssuePriority, ActivityAction } from "@/types";

type Issue = {
  id: string;
  sequenceId: number;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: string | null;
  dueDate: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

type Comment = { id: string; authorId: string; body: string; createdAt: Date; updatedAt: Date };
type Activity = { id: string; actorId: string; action: ActivityAction; fromValue: string | null; toValue: string | null; createdAt: Date };

const STATUS_META: Record<IssueStatus, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  backlog:     { label: "Backlog",     Icon: CircleDot,    color: "text-slate-400",  bg: "bg-slate-400/10" },
  todo:        { label: "Todo",        Icon: Circle,       color: "text-blue-400",   bg: "bg-blue-400/10" },
  in_progress: { label: "In Progress", Icon: Timer,        color: "text-amber-400",  bg: "bg-amber-400/10" },
  in_review:   { label: "In Review",   Icon: Eye,          color: "text-violet-400", bg: "bg-violet-400/10" },
  done:        { label: "Done",        Icon: CheckCircle2, color: "text-emerald-400",bg: "bg-emerald-400/10" },
  cancelled:   { label: "Cancelled",   Icon: Ban,          color: "text-slate-500",  bg: "bg-slate-400/10" },
};

const PRIORITY_META: Record<IssuePriority, { label: string; Icon: React.ElementType; color: string }> = {
  urgent: { label: "Urgent", Icon: AlertCircle, color: "text-red-400" },
  high:   { label: "High",   Icon: ArrowUp,     color: "text-orange-400" },
  medium: { label: "Medium", Icon: Minus,       color: "text-amber-400" },
  low:    { label: "Low",    Icon: ArrowDown,   color: "text-blue-400" },
  none:   { label: "None",   Icon: Minus,       color: "text-slate-500" },
};

function MetaSelect<T extends string>({
  value,
  options,
  renderOption,
  onChange,
  children,
}: {
  value: T;
  options: T[];
  renderOption: (v: T) => React.ReactNode;
  onChange: (v: T) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent"
      >
        {children}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent",
                  opt === value && "bg-accent/60",
                )}
              >
                {renderOption(opt)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function IssueDetailClient({
  issue: initialIssue,
  labels,
  comments: initialComments,
  activity,
  workspaceSlug,
  currentUserId,
}: {
  issue: Issue;
  labels: { id: string; name: string; color: string }[];
  comments: Comment[];
  activity: Activity[];
  workspaceSlug: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [issue, setIssue] = useState(initialIssue);
  const [comments, setComments] = useState(initialComments);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(issue.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(issue.description ?? "");
  const [commentBody, setCommentBody] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentBody, setEditCommentBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (status: IssueStatus) => {
    setIssue((prev) => ({ ...prev, status }));
    const result = await updateIssue({ issueId: issue.id, workspaceSlug, status });
    if (!result.success) { setIssue(initialIssue); setError(result.error.message); }
  };

  const handlePriorityChange = async (priority: IssuePriority) => {
    setIssue((prev) => ({ ...prev, priority }));
    const result = await updateIssue({ issueId: issue.id, workspaceSlug, priority });
    if (!result.success) { setIssue(initialIssue); setError(result.error.message); }
  };

  const handleTitleSave = async () => {
    if (!titleDraft.trim()) return;
    setEditingTitle(false);
    setIssue((prev) => ({ ...prev, title: titleDraft }));
    const result = await updateIssue({ issueId: issue.id, workspaceSlug, title: titleDraft });
    if (!result.success) { setIssue(initialIssue); setError(result.error.message); }
  };

  const handleDescSave = async () => {
    setEditingDesc(false);
    setIssue((prev) => ({ ...prev, description: descDraft || null }));
    const result = await updateIssue({ issueId: issue.id, workspaceSlug, description: descDraft || null });
    if (!result.success) { setIssue(initialIssue); setError(result.error.message); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    const result = await addComment({ issueId: issue.id, workspaceSlug, body: commentBody });
    if (result.success) {
      setCommentBody("");
      setComments((prev) => [
        { id: result.data.id, authorId: currentUserId, body: result.data.body, createdAt: new Date(), updatedAt: new Date() },
        ...prev,
      ]);
    } else {
      setError(result.error.message);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    const result = await updateComment({ commentId, workspaceSlug, body: editCommentBody });
    if (result.success) {
      setComments((prev) =>
        prev.map((c) => c.id === commentId ? { ...c, body: editCommentBody } : c),
      );
      setEditingCommentId(null);
    } else {
      setError(result.error.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const result = await deleteComment({ commentId, workspaceSlug });
    if (result.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } else {
      setError(result.error.message);
    }
  };

  const handleDeleteIssue = async () => {
    startTransition(async () => {
      const result = await deleteIssue({ issueId: issue.id, workspaceSlug });
      if (result.success) {
        router.back();
      } else {
        setError(result.error.message);
      }
    });
  };

  const statusMeta = STATUS_META[issue.status];
  const priorityMeta = PRIORITY_META[issue.priority];
  const StatusIcon = statusMeta.Icon;
  const PriorityIcon = priorityMeta.Icon;

  return (
    <div className="flex gap-0 h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto border-r border-border/60 p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {/* Title */}
        <div>
          {editingTitle ? (
            <div className="flex items-start gap-2">
              <textarea
                className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                rows={2}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTitleSave(); } if (e.key === "Escape") setEditingTitle(false); }}
              />
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={handleTitleSave} className="h-7 w-7 p-0"><Check className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingTitle(false); setTitleDraft(issue.title); }} className="h-7 w-7 p-0"><X className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ) : (
            <div className="group flex items-start gap-2">
              <h1 className="flex-1 text-xl font-semibold leading-snug">{issue.title}</h1>
              <button
                onClick={() => { setEditingTitle(true); setTitleDraft(issue.title); }}
                className="mt-1 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Description</div>
          {editingDesc ? (
            <div className="space-y-2">
              <Textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                rows={5}
                autoFocus
                className="resize-none text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleDescSave} className="h-7 text-xs">Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingDesc(false); setDescDraft(issue.description ?? ""); }} className="h-7 text-xs">Cancel</Button>
              </div>
            </div>
          ) : (
            <div
              className="group min-h-[60px] cursor-text rounded-lg p-2 text-sm text-foreground/80 hover:bg-accent/40 transition-colors"
              onClick={() => setEditingDesc(true)}
            >
              {issue.description || (
                <span className="text-muted-foreground/40">Add description…</span>
              )}
            </div>
          )}
        </div>

        {/* Labels */}
        {labels.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Labels</div>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: `${label.color}22`, color: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </span>
          </div>

          <form onSubmit={handleAddComment} className="mb-4 space-y-2">
            <Textarea
              placeholder="Write a comment…"
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
            <Button type="submit" size="sm" disabled={!commentBody.trim()} className="h-7 text-xs">
              Add comment
            </Button>
          </form>

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="group rounded-lg border border-border/60 bg-card p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {comment.authorId.slice(0, 8)}…
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {comment.authorId === currentUserId && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingCommentId(comment.id); setEditCommentBody(comment.body); }}
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="rounded p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editCommentBody}
                      onChange={(e) => setEditCommentBody(e.target.value)}
                      rows={2}
                      autoFocus
                      className="resize-none text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateComment(comment.id)} className="h-7 text-xs">Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="h-7 text-xs">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.body}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar — metadata + activity */}
      <div className="w-72 shrink-0 overflow-y-auto p-5 space-y-6">
        {/* Properties */}
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Properties
          </p>
          <div className="space-y-1">
            {/* Status */}
            <div className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent/50">
              <span className="text-xs text-muted-foreground">Status</span>
              <MetaSelect
                value={issue.status}
                options={["backlog", "todo", "in_progress", "in_review", "done", "cancelled"] as IssueStatus[]}
                onChange={handleStatusChange}
                renderOption={(s) => {
                  const { Icon, color, label } = STATUS_META[s];
                  return <><Icon className={cn("h-3.5 w-3.5", color)} /><span>{label}</span></>;
                }}
              >
                <span className={cn("flex h-5 w-5 items-center justify-center rounded", statusMeta.bg)}>
                  <StatusIcon className={cn("h-3 w-3", statusMeta.color)} />
                </span>
                <span className="text-xs font-medium">{statusMeta.label}</span>
              </MetaSelect>
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent/50">
              <span className="text-xs text-muted-foreground">Priority</span>
              <MetaSelect
                value={issue.priority}
                options={["urgent", "high", "medium", "low", "none"] as IssuePriority[]}
                onChange={handlePriorityChange}
                renderOption={(p) => {
                  const { Icon, color, label } = PRIORITY_META[p];
                  return <><Icon className={cn("h-3.5 w-3.5", color)} /><span>{label}</span></>;
                }}
              >
                <PriorityIcon className={cn("h-3.5 w-3.5", priorityMeta.color)} />
                <span className="text-xs font-medium">{priorityMeta.label}</span>
              </MetaSelect>
            </div>

            {/* Due date */}
            <div className="flex items-center justify-between rounded-md px-2 py-1.5">
              <span className="text-xs text-muted-foreground">Due date</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {issue.dueDate
                  ? new Date(issue.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "None"}
              </span>
            </div>

            {/* Created */}
            <div className="flex items-center justify-between rounded-md px-2 py-1.5">
              <span className="text-xs text-muted-foreground">Created</span>
              <span className="text-xs text-muted-foreground">
                {new Date(issue.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="border-t border-border/60 pt-4">
          <button
            onClick={handleDeleteIssue}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete issue
          </button>
        </div>

        {/* Activity */}
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Activity
          </p>
          <ActivityFeed activities={activity} />
        </div>
      </div>
    </div>
  );
}
