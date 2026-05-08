"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/server/actions/workspace.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Plus } from "lucide-react";

export function CreateWorkspaceForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createWorkspace({ name });
    setLoading(false);
    if (result.success) {
      router.push(`/workspaces/${result.data.slug}`);
    } else {
      setError(result.error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="New workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !name.trim()} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {loading ? "Creating…" : "Create"}
        </Button>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </form>
  );
}
