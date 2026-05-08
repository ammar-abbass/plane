import { auth } from "@clerk/nextjs/server";
import { getWorkspaceBySlug } from "@/server/queries/workspace.queries";
import { notFound, redirect } from "next/navigation";
import { requireWorkspaceMember } from "@/lib/auth";
import { UpdateWorkspaceForm } from "@/components/workspaces/update-workspace-form";
import { DeleteWorkspaceButton } from "@/components/workspaces/delete-workspace-button";
import { Header } from "@/components/layout/header";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceSlug } = await params;
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) notFound();

  const member = await requireWorkspaceMember(workspaceSlug, userId, "admin");

  return (
    <>
      <Header title="Settings" />
      <div className="mx-auto max-w-xl space-y-8 p-6">
        <section>
          <h2 className="mb-4 text-sm font-semibold">General</h2>
          <UpdateWorkspaceForm workspaceSlug={workspaceSlug} currentName={workspace.name} />
        </section>

        {member.role === "owner" && (
          <section>
            <h2 className="mb-1 text-sm font-semibold text-destructive">Danger Zone</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Once deleted, this workspace and all its data cannot be recovered.
            </p>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <DeleteWorkspaceButton workspaceSlug={workspaceSlug} />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
