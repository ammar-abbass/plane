import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getProjectById } from "@/server/queries/project.queries";
import { requireWorkspaceMember } from "@/lib/auth";
import { UpdateProjectForm } from "@/components/projects/update-project-form";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { Header } from "@/components/layout/header";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceSlug, projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) notFound();

  await requireWorkspaceMember(workspaceSlug, userId, "admin");

  return (
    <>
      <Header title={`${project.name} — Settings`} />
      <div className="mx-auto max-w-xl space-y-8 p-6">
        <section>
          <h2 className="mb-4 text-sm font-semibold">General</h2>
          <UpdateProjectForm
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            currentName={project.name}
            currentDescription={project.description}
          />
        </section>
        <section>
          <h2 className="mb-1 text-sm font-semibold text-destructive">Danger Zone</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Deleting this project will permanently remove all its issues and data.
          </p>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <DeleteProjectButton workspaceSlug={workspaceSlug} projectId={projectId} />
          </div>
        </section>
      </div>
    </>
  );
}
