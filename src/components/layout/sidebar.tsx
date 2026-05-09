"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutGrid,
  FolderKanban,
  Settings,
  Users,
  ChevronRight,
  Layers3,
  ArrowLeft,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/cn";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
};

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <item.icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      {item.label}
      {isActive && (
        <ChevronRight className="ml-auto h-3 w-3 text-muted-foreground" />
      )}
    </Link>
  );
}

export function Sidebar() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string | undefined;
  const projectId = params.projectId as string | undefined;

  if (!workspaceSlug) return null;

  const workspaceNavItems: NavItem[] = [
    {
      href: `/workspaces/${workspaceSlug}`,
      label: "Overview",
      icon: LayoutGrid,
      exact: true,
    },
    {
      href: `/workspaces/${workspaceSlug}/projects`,
      label: "Projects",
      icon: FolderKanban,
    },
    {
      href: `/workspaces/${workspaceSlug}/settings/members`,
      label: "Members",
      icon: Users,
    },
    {
      href: `/workspaces/${workspaceSlug}/settings`,
      label: "Settings",
      icon: Settings,
      exact: true,
    },
  ];

  const projectNavItems: NavItem[] = projectId ? [
    {
      href: `/workspaces/${workspaceSlug}/projects/${projectId}`,
      label: "Issues",
      icon: LayoutGrid,
      exact: true,
    },
    {
      href: `/workspaces/${workspaceSlug}/projects/${projectId}/settings`,
      label: "Project Settings",
      icon: Settings2,
    },
  ] : [];

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[220px] flex-col border-r border-border/40 bg-card/30">
      {/* Logo */}
      <div className="flex h-[52px] items-center gap-3 border-b border-border/40 px-5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
          <Layers3 className="h-3.5 w-3.5 text-background" />
        </div>
        <Link
          href="/workspaces"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          Plane
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {projectId ? (
          <>
            <Link
              href={`/workspaces/${workspaceSlug}/projects`}
              className="group mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to Projects
            </Link>
            <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
              Project
            </p>
            {projectNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        ) : (
          <>
            <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
              Workspace
            </p>
            {workspaceNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* Workspace slug footer */}
      <div className="border-t border-border/40 p-4">
        <Link 
          href={`/workspaces/${workspaceSlug}`}
          className="group flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors hover:bg-accent/40 cursor-pointer"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-indigo-500/20">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
          </div>
          <span className="truncate text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {workspaceSlug}
          </span>
        </Link>
      </div>
    </aside>
  );
}
