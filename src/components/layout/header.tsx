"use client";

import { UserButton } from "@clerk/nextjs";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type HeaderProps = {
  onSearch?: () => void;
  onNewIssue?: () => void;
  title?: string;
  className?: string;
};

export function Header({ onSearch, onNewIssue, title, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-border/40 bg-background/60 px-6 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {title && (
          <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        )}
        {onSearch && (
          <button
            onClick={onSearch}
            className="flex items-center gap-2 rounded-md border border-border/80 bg-background px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search issues…</span>
            <kbd className="ml-1 hidden rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px] sm:inline-flex">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onNewIssue && (
          <Button
            size="sm"
            onClick={onNewIssue}
            className="h-7 gap-1.5 px-2.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            New Issue
          </Button>
        )}
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
