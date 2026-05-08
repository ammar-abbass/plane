import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import {
  getIssueById, getIssueLabels, getIssueComments, getIssueActivity,
} from "@/server/queries/issue.queries";
import { requireWorkspaceMember } from "@/lib/auth";
import { IssueDetailClient } from "@/components/issues/issue-detail";
import { Header } from "@/components/layout/header";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string; issueId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceSlug, projectId, issueId } = await params;
  const issue = await getIssueById(issueId);
  if (!issue) notFound();

  await requireWorkspaceMember(workspaceSlug, userId);

  const [labels, comments, activity] = await Promise.all([
    getIssueLabels(issueId),
    getIssueComments(issueId),
    getIssueActivity(issueId),
  ]);

  return (
    <>
      <Header
        title={`#${issue.sequenceId}`}
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 border-b border-border/60 px-5 py-2.5 text-xs text-muted-foreground">
        <Link href={`/workspaces/${workspaceSlug}/projects/${projectId}`} className="hover:text-foreground transition-colors">
          Issues
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-mono text-foreground/60">#{issue.sequenceId}</span>
        <span className="truncate max-w-xs">{issue.title}</span>
      </nav>

      <IssueDetailClient
        issue={issue}
        labels={labels}
        comments={comments}
        activity={activity}
        workspaceSlug={workspaceSlug}
        currentUserId={userId}
      />
    </>
  );
}
