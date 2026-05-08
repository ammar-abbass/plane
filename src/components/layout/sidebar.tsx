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

  if (!workspaceSlug) return null;

  const navItems: NavItem[] = [
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

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[220px] flex-col border-r border-border/60 bg-card">
      {/* Logo */}
      <div className="flex h-[52px] items-center gap-2.5 border-b border-border/60 px-4">
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
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Workspace
        </p>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Workspace slug footer */}
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5">
          <div className="h-5 w-5 shrink-0 rounded-sm bg-gradient-to-br from-violet-500 to-indigo-600" />
          <span className="truncate text-xs font-medium text-muted-foreground">
            {workspaceSlug}
          </span>
        </div>
      </div>
    </aside>
  );
}
