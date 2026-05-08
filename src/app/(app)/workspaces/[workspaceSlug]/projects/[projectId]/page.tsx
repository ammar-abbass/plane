import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getProjectById } from "@/server/queries/project.queries";
import { getIssuesWithLabels } from "@/server/queries/issue.queries";
import { requireWorkspaceMember } from "@/lib/auth";
import { ProjectPageClient } from "@/components/projects/project-page-client";
import { Suspense } from "react";
import { IssueBoardSkeleton } from "@/components/issues/issue-board-skeleton";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceSlug, projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) notFound();

  const member = await requireWorkspaceMember(workspaceSlug, userId);
  const issues = await getIssuesWithLabels(projectId);
  const canCreateIssues = member.role !== "viewer";

  return (
    <Suspense fallback={<IssueBoardSkeleton />}>
      <ProjectPageClient
        project={project}
        issues={issues}
        workspaceSlug={workspaceSlug}
        canCreateIssues={canCreateIssues}
      />
    </Suspense>
  );
}
