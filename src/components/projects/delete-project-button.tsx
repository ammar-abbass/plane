"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/server/actions/project.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Trash2 } from "lucide-react";

export function DeleteProjectButton({
  workspaceSlug,
  projectId,
}: {
  workspaceSlug: string;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    const result = await deleteProject({ projectId, workspaceSlug });
    setLoading(false);
    if (result.success) {
      router.push(`/workspaces/${workspaceSlug}/projects`);
    } else {
      setError(result.error.message);
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Delete project</p>
          <p className="text-xs text-muted-foreground">
            Permanently delete this project and all its issues.
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setOpen(true)}
          className="h-7 shrink-0 gap-1.5 text-xs"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm gap-0 p-0">
          <DialogHeader className="border-b border-border/60 px-5 py-4">
            <DialogTitle className="text-sm font-semibold">Delete project</DialogTitle>
          </DialogHeader>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              All issues, comments, and activity for this project will be{" "}
              <span className="font-semibold text-foreground">permanently deleted</span>.
            </p>
            {error && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 px-5 py-3">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-7 text-xs">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="h-7 text-xs"
            >
              {loading ? "Deleting…" : "Yes, delete project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
