"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Search, Hash, CircleDot, Circle, Timer, Eye, CheckCircle2, Ban,
  AlertCircle, ArrowUp, Minus, ArrowDown, Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { SearchResult, IssueStatus, IssuePriority } from "@/types";

const STATUS_ICON: Record<IssueStatus, React.ElementType> = {
  backlog:     CircleDot,
  todo:        Circle,
  in_progress: Timer,
  in_review:   Eye,
  done:        CheckCircle2,
  cancelled:   Ban,
};

const STATUS_COLOR: Record<IssueStatus, string> = {
  backlog:     "text-slate-400",
  todo:        "text-blue-400",
  in_progress: "text-amber-400",
  in_review:   "text-violet-400",
  done:        "text-emerald-400",
  cancelled:   "text-slate-500",
};

const PRIORITY_ICON: Record<IssuePriority, React.ElementType> = {
  urgent: AlertCircle,
  high:   ArrowUp,
  medium: Minus,
  low:    ArrowDown,
  none:   Minus,
};

const PRIORITY_COLOR: Record<IssuePriority, string> = {
  urgent: "text-red-400",
  high:   "text-orange-400",
  medium: "text-amber-400",
  low:    "text-blue-400",
  none:   "text-slate-500",
};

type Props = {
  workspaceSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ workspaceSlug, open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const router = useRouter();

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const url = new URL(`/api/workspaces/${workspaceSlug}/search`, window.location.origin);
        url.searchParams.set("q", q);
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json() as { results?: SearchResult[] };
          setResults(data.results ?? []);
          setSelected(0);
        }
      } catch {
        setResults([]);
      }
      setLoading(false);
    },
    [workspaceSlug],
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 150);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const navigate = (result: SearchResult) => {
    onOpenChange(false);
    router.push(`/workspaces/${workspaceSlug}/projects/${result.projectId}/issues/${result.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      navigate(results[selected]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 max-w-xl" aria-label="Search issues">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            placeholder="Search issues…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <span className="text-xs">✕</span>
            </button>
          )}
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {!query.trim() && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="h-6 w-6 text-muted-foreground/30" />
              <p className="mt-2 text-xs text-muted-foreground/60">Type to search across all issues</p>
            </div>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-medium text-foreground/60">No results for "{query}"</p>
              <p className="mt-1 text-xs text-muted-foreground/50">Try different keywords</p>
            </div>
          )}

          {results.map((result, idx) => {
            const StatusIcon = STATUS_ICON[result.status];
            const PriorityIcon = PRIORITY_ICON[result.priority];
            return (
              <button
                key={result.id}
                onClick={() => navigate(result)}
                onMouseEnter={() => setSelected(idx)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  selected === idx ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                <PriorityIcon className={cn("h-3.5 w-3.5 shrink-0", PRIORITY_COLOR[result.priority])} />
                <span className="flex-1 truncate text-sm font-medium">{result.title}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusIcon className={cn("h-3.5 w-3.5", STATUS_COLOR[result.status])} />
                  <span className="flex items-center gap-0.5 font-mono text-[10px] text-muted-foreground">
                    <Hash className="h-2.5 w-2.5" />
                    {result.sequenceId}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-border/60 px-4 py-2">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[9px]">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[9px]">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[9px]">Esc</kbd>
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
