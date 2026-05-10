"use client";

import { useState } from "react";
import { IssueBoard } from "@/components/issues/issue-board";
import { IssueFormDialog } from "@/components/issues/issue-form";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/search/command-palette";
import { useQuery } from "@tanstack/react-query";
import { useIssueStream } from "@/hooks/use-issue-stream";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { IssueStatus, IssuePriority } from "@/types";

type Issue = {
  id: string;
  sequenceId: number;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: string | null;
  dueDate: string | null;
  labels: { id: string; name: string; color: string }[];
};

type Props = {
  project: { id: string; name: string; slug: string; description: string | null };
  issues: Issue[];
  workspaceSlug: string;
  canCreateIssues: boolean;
};

export function ProjectPageClient({ project, issues, workspaceSlug, canCreateIssues }: Props) {
  const [issueFormOpen, setIssueFormOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useIssueStream(workspaceSlug);

  const { data: realtimeIssues } = useQuery({
    queryKey: ["issues", project.id, issues],
    queryFn: () => issues,
    initialData: issues,
  });

  useKeyboardShortcuts({
    onNewIssue: canCreateIssues ? () => { setIssueFormOpen(true); } : undefined,
    onSearch: () => { setSearchOpen(true); },
  });

  return (
    <div className="flex flex-col h-full">
      <Header
        title={project.name}
        onSearch={() => { setSearchOpen(true); }}
        onNewIssue={canCreateIssues ? () => { setIssueFormOpen(true); } : undefined}
      />

      <div className="flex-1 min-h-0 p-5 overflow-hidden">
        <IssueBoard issues={realtimeIssues} />
      </div>

      {canCreateIssues && (
        <IssueFormDialog
          workspaceSlug={workspaceSlug}
          projectId={project.id}
          open={issueFormOpen}
          onOpenChange={setIssueFormOpen}
        />
      )}

      <CommandPalette
        workspaceSlug={workspaceSlug}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </div>
  );
}
