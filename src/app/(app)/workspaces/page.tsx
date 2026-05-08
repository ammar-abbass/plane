import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserWorkspaces } from "@/server/queries/workspace.queries";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";
import { CreateWorkspaceForm } from "@/components/workspaces/create-workspace-form";
import { Layers3 } from "lucide-react";

export default async function WorkspacesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaces = await getUserWorkspaces(userId);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-[52px] items-center border-b border-border/60 px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
            <Layers3 className="h-3.5 w-3.5 text-background" />
          </div>
          <span className="text-sm font-semibold">Plane</span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Your workspaces</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Select a workspace to continue or create a new one.
            </p>
          </div>

          <div className="space-y-4">
            <WorkspaceSwitcher workspaces={workspaces} />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">or</span>
              </div>
            </div>
            <CreateWorkspaceForm />
          </div>
        </div>
      </div>
    </div>
  );
}
