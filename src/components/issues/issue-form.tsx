"use client";

import { useState } from "react";
import { createIssue } from "@/server/actions/issue.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, ArrowUp, Minus, ArrowDown, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { IssueStatus, IssuePriority } from "@/types";

const STATUSES: { value: IssueStatus; label: string }[] = [
  { value: "backlog",     label: "Backlog" },
  { value: "todo",        label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review",   label: "In Review" },
  { value: "done",        label: "Done" },
  { value: "cancelled",   label: "Cancelled" },
];

const PRIORITIES: { value: IssuePriority; label: string; Icon: React.ElementType; color: string }[] = [
  { value: "urgent", label: "Urgent", Icon: AlertCircle, color: "text-red-400" },
  { value: "high",   label: "High",   Icon: ArrowUp,     color: "text-orange-400" },
  { value: "medium", label: "Medium", Icon: Minus,       color: "text-amber-400" },
  { value: "low",    label: "Low",    Icon: ArrowDown,   color: "text-blue-400" },
  { value: "none",   label: "None",   Icon: Minus,       color: "text-slate-400" },
];

type Props = {
  workspaceSlug: string;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function IssueFormDialog({ workspaceSlug, projectId, open, onOpenChange, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IssueStatus>("backlog");
  const [priority, setPriority] = useState<IssuePriority>("none");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setStatus("backlog");
    setPriority("none");
    setDueDate("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createIssue({
      workspaceSlug,
      projectId,
      title,
      description: description || undefined,
      status,
      priority,
      dueDate: dueDate || undefined,
    });
    setLoading(false);
    if (result.success) {
      reset();
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError(result.error.message);
    }
  };

  const selectedPriority = PRIORITIES.find((p) => p.value === priority)!;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="gap-0 p-0 max-w-lg">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold">Create Issue</DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-4">
            {/* Title */}
            <Input
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={255}
              className="border-0 px-0 text-sm font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0 h-auto text-base"
              autoFocus
            />

            {/* Description */}
            <Textarea
              placeholder="Add description… (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              rows={3}
              className="resize-none border-0 px-0 text-sm placeholder:text-muted-foreground/40 focus-visible:ring-0"
            />

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Status */}
              <Select value={status} onValueChange={(v) => setStatus(v as IssueStatus)}>
                <SelectTrigger className="h-7 w-auto gap-1.5 rounded-md border-border/60 px-2 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority */}
              <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
                <SelectTrigger className="h-7 w-auto gap-1.5 rounded-md border-border/60 px-2 text-xs font-medium">
                  <selectedPriority.Icon className={cn("h-3 w-3", selectedPriority.color)} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <p.Icon className={cn("h-3 w-3", p.color)} />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Due date */}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-7 rounded-md border border-border/60 bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {error && (
              <p className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/60 px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !title.trim()}
              className="h-7 px-3 text-xs"
            >
              {loading ? "Creating…" : "Create Issue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
