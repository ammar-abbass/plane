import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getProjectById } from "@/server/queries/project.queries";
import { requireWorkspaceMember } from "@/lib/auth";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string; projectId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceSlug, projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) notFound();

  await requireWorkspaceMember(workspaceSlug, userId);

  return <div className="flex h-screen flex-col overflow-hidden">{children}</div>;
}
