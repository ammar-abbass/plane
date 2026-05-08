"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteWorkspace } from "@/server/actions/workspace.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Trash2 } from "lucide-react";

export function DeleteWorkspaceButton({ workspaceSlug }: { workspaceSlug: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    const result = await deleteWorkspace(workspaceSlug);
    setLoading(false);
    if (result.success) {
      router.push("/workspaces");
    } else {
      setError(result.error.message);
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Delete workspace</p>
          <p className="text-xs text-muted-foreground">
            Permanently delete this workspace and all its projects and issues.
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
            <DialogTitle className="text-sm font-semibold">Delete workspace</DialogTitle>
          </DialogHeader>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              This action is <span className="font-semibold text-foreground">irreversible</span>. All
              projects, issues, activity, and member data will be permanently deleted.
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
              {loading ? "Deleting…" : "Yes, delete workspace"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
