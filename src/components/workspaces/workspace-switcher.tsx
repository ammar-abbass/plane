"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const WORKSPACE_COLORS = [
  "from-violet-500 to-indigo-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
];

function getWorkspaceColor(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  return WORKSPACE_COLORS[Math.abs(hash) % WORKSPACE_COLORS.length]!;
}

export function WorkspaceSwitcher({
  workspaces,
}: {
  workspaces: { workspace: { id: string; name: string; slug: string }; role: string }[];
}) {
  const params = useParams();
  const currentSlug = params.workspaceSlug as string | undefined;

  if (workspaces.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No workspaces yet. Create your first one below.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {workspaces.map(({ workspace, role }) => {
        const isActive = currentSlug === workspace.slug;
        const color = getWorkspaceColor(workspace.slug);
        return (
          <Link
            key={workspace.id}
            href={`/workspaces/${workspace.slug}`}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-150",
              isActive
                ? "border-border bg-accent"
                : "border-border/50 hover:border-border hover:bg-accent/50",
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-xs font-bold text-white",
                color,
              )}
            >
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{workspace.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{role}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          </Link>
        );
      })}
    </div>
  );
}
