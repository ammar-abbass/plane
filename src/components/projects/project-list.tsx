"use client";

import Link from "next/link";
import { FolderKanban, ChevronRight } from "lucide-react";

export function ProjectList({
  projects,
  workspaceSlug,
}: {
  projects: { id: string; name: string; slug: string; description: string | null }[];
  workspaceSlug: string;
}) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <FolderKanban className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-sm font-medium">No projects yet</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Create your first project to start tracking issues.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/workspaces/${workspaceSlug}/projects/${project.id}`}
          className="group flex items-center justify-between rounded-lg border border-border/60 bg-card p-4 transition-all duration-150 hover:border-border hover:shadow-sm"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium">{project.name}</p>
              {project.description && (
                <p className="truncate text-xs text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}
