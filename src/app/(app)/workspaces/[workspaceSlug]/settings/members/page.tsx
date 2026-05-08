import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceBySlug, getWorkspaceMembers } from "@/server/queries/workspace.queries";
import { requireWorkspaceMember } from "@/lib/auth";
import { MemberList } from "@/components/workspaces/member-list";
import { InviteMemberForm } from "@/components/workspaces/invite-member-form";
import { Header } from "@/components/layout/header";

export default async function MembersSettingsPage({
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
  const members = await getWorkspaceMembers(workspace.id);

  return (
    <>
      <Header title="Members" />
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <InviteMemberForm workspaceSlug={workspaceSlug} />
        <MemberList
          members={members}
          workspaceSlug={workspaceSlug}
          currentUserId={userId}
          isAdmin={member.role === "owner" || member.role === "admin"}
        />
      </div>
    </>
  );
}
