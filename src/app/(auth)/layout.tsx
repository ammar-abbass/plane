import { Layers3 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel */}
      <div className="hidden w-[420px] shrink-0 flex-col justify-between border-r border-border/60 bg-card p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
            <Layers3 className="h-4 w-4 text-background" />
          </div>
          <span className="text-sm font-semibold">Plane</span>
        </div>
        <div>
          <blockquote className="space-y-2">
            <p className="text-sm leading-relaxed text-foreground/80">
              "A multi-tenant real-time collaboration platform with workspace isolation and immutable audit logs."
            </p>
            <footer className="text-xs text-muted-foreground">Built with Next.js 16 + Drizzle ORM</footer>
          </blockquote>
        </div>
        <div className="space-y-1">
          {[
            "Workspace-isolated multi-tenancy",
            "Real-time SSE + Upstash pub/sub",
            "Immutable audit log per issue",
            "Typed error contracts",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-1 w-1 rounded-full bg-emerald-400" />
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
