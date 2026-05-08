import { auth } from "@clerk/nextjs/server";
import { getWorkspaceBySlug, getWorkspaceMembers } from "@/server/queries/workspace.queries";
import { getProjectsByWorkspace } from "@/server/queries/project.queries";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectForm } from "@/components/projects/project-form";
import { MemberList } from "@/components/workspaces/member-list";
import { Header } from "@/components/layout/header";
import { notFound } from "next/navigation";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { userId } = await auth();
  const { workspaceSlug } = await params;
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace || !userId) notFound();

  const projects = await getProjectsByWorkspace(workspace.id);
  const members = await getWorkspaceMembers(workspace.id);
  const isAdmin = members.some(
    (m) => m.userId === userId && (m.role === "owner" || m.role === "admin"),
  );

  return (
    <>
      <Header title={workspace.name} />
      <div className="mx-auto max-w-4xl space-y-10 p-6">
        {/* Projects */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Projects</h2>
              <p className="text-xs text-muted-foreground">
                {projects.length} project{projects.length !== 1 ? "s" : ""}
              </p>
            </div>
            {isAdmin && <ProjectForm workspaceSlug={workspaceSlug} />}
          </div>
          <ProjectList projects={projects} workspaceSlug={workspaceSlug} />
        </section>

        {/* Members */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold">Members</h2>
            <p className="text-xs text-muted-foreground">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
          <MemberList
            members={members}
            workspaceSlug={workspaceSlug}
            currentUserId={userId}
            isAdmin={isAdmin}
          />
        </section>
      </div>
    </>
  );
}
