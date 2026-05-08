import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceBySlug } from "@/server/queries/workspace.queries";
import { getProjectsByWorkspace } from "@/server/queries/project.queries";
import { requireWorkspaceMember } from "@/lib/auth";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectForm } from "@/components/projects/project-form";
import { Header } from "@/components/layout/header";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceSlug } = await params;
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) notFound();

  const member = await requireWorkspaceMember(workspaceSlug, userId);
  const projects = await getProjectsByWorkspace(workspace.id);
  const isAdmin = member.role === "owner" || member.role === "admin";

  return (
    <>
      <Header title="Projects" onNewIssue={undefined} />
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
          {isAdmin && <ProjectForm workspaceSlug={workspaceSlug} />}
        </div>
        <ProjectList projects={projects} workspaceSlug={workspaceSlug} />
      </div>
    </>
  );
}
