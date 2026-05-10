"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/server/actions/project.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Plus, X } from "lucide-react";

export function ProjectForm({
  workspaceSlug,
  onSuccess,
}: {
  workspaceSlug: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const reset = () => {
    setName("");
    setDescription("");
    setError(null);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createProject({
      workspaceSlug,
      name,
      description: description || undefined,
    });
    setLoading(false);
    if (result.success) {
      reset();
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } else {
      setError(result.error.message);
    }
  };

  return (
    <>
      <Button
        variant="premium"
        size="sm"
        onClick={() => {
          setOpen(true);
        }}
        className="h-7 gap-1.5 px-3 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        New Project
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent hideCloseButton className="gap-0 p-0 max-w-md">
          <DialogHeader className="border-b border-border/60 px-5 py-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-semibold">Create Project</DialogTitle>
              <button
                onClick={() => {
                  setOpen(false);
                }}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 px-5 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Project name</label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  required
                  maxLength={100}
                  placeholder="e.g. Backend API"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Description (optional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                  }}
                  maxLength={500}
                  rows={2}
                  placeholder="What is this project about?"
                  className="resize-none"
                />
              </div>
              {error && (
                <p className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-border/60 px-5 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false);
                }}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading || !name.trim()}
                className="h-7 text-xs"
              >
                {loading ? "Creating…" : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
