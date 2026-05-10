"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "@/server/actions/project.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function UpdateProjectForm({
  workspaceSlug,
  projectId,
  currentName,
  currentDescription,
}: {
  workspaceSlug: string;
  projectId: string;
  currentName: string;
  currentDescription: string | null;
}) {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    const result = await updateProject({
      projectId,
      workspaceSlug,
      name,
      description: description || undefined,
    });
    setLoading(false);
    if (result.success) {
      setSaved(true);
      router.refresh();
    } else {
      setError(result.error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Project name</label>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          required
          maxLength={100}
          className="max-w-sm"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
        <Textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setSaved(false);
          }}
          maxLength={500}
          rows={2}
          className="max-w-sm resize-none"
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
      {saved && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Saved
        </p>
      )}
      <Button type="submit" size="sm" disabled={loading || !name.trim()} className="h-7 text-xs">
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
