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
      <div className="glass-panel flex flex-col items-center justify-center rounded-2xl py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
          <FolderKanban className="h-6 w-6 text-indigo-400" />
        </div>
        <h3 className="mt-5 text-sm font-medium text-foreground">No projects yet</h3>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-[250px]">
          Create your first project to start tracking issues for your team.
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
          className="group flex items-center justify-between rounded-xl border border-border/40 bg-card/40 p-4 transition-all duration-200 hover:bg-card/60 hover:border-border/80 hover:shadow-md hover:-translate-y-[1px]"
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
