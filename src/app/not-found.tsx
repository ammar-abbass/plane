import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Layers3 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
        <Layers3 className="h-5 w-5 text-background" />
      </div>
      <div>
        <p className="font-mono text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="mt-1 text-xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or you don't have access to it.
        </p>
      </div>
      <Button asChild size="sm">
        <Link href="/workspaces">Back to workspaces</Link>
      </Button>
    </div>
  );
}
