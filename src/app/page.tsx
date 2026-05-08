import Link from "next/link";
import { ArrowRight, Layers, Zap, ShieldCheck, Database, GitCommit, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      {/* Navbar */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/40 bg-background/60 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
            <Layers className="h-3.5 w-3.5 text-background" />
          </div>
          <span className="font-semibold tracking-tight">Plane</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Button variant="premium" size="sm" asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40">
          {/* Subtle Glow Background */}
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
          
          <div className="container mx-auto flex max-w-[800px] flex-col items-center px-6 text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2" />
              v1.0 is now live
            </div>
            
            <h1 className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl md:text-8xl">
              Linear scale.<br />Vercel speed.
            </h1>
            
            <p className="mt-6 max-w-[600px] text-lg text-muted-foreground sm:text-xl">
              A multi-tenant real-time collaboration platform with hard workspace isolation and immutable audit logs. Built for modern engineering teams.
            </p>
            
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Button variant="premium" size="lg" className="h-12 px-8 text-base" asChild>
                <Link href="/sign-up">
                  Start Building <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="glass" size="lg" className="h-12 px-8 text-base" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="border-t border-border/40 bg-card/20 py-24 md:py-32">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Engineered for Reliability</h2>
              <p className="mt-4 text-muted-foreground">Architectural decisions that prioritize speed and safety.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="glass-panel group relative rounded-2xl p-8 transition-transform hover:-translate-y-1">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Hard Multi-tenancy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every query is scoped to a workspace ID. Cross-workspace access is architecturally impossible.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-panel group relative rounded-2xl p-8 transition-transform hover:-translate-y-1">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Real-time SSE</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Mutations broadcast to all workspace members in under 2 seconds via Server-Sent Events and Redis pub/sub.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-panel group relative rounded-2xl p-8 transition-transform hover:-translate-y-1">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Immutable Audit Log</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every state change writes an append-only activity record in the same Postgres transaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive Section */}
        <section className="py-24 md:py-32 relative overflow-hidden">
           <div className="pointer-events-none absolute right-0 top-1/2 -z-10 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full bg-violet-500/10 blur-[100px]" />
           <div className="container mx-auto px-6 max-w-6xl">
              <div className="grid gap-16 md:grid-cols-2 items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">No generic API layer.</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Server actions are typed TypeScript functions called directly from client components. Auth, validation, DB write, activity record, and SSE broadcast are co-located in one auditable function.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-sm font-medium">
                      <Database className="h-5 w-5 text-indigo-400" />
                      Drizzle ORM for SQL-first type safety.
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium">
                      <GitCommit className="h-5 w-5 text-violet-400" />
                      Zero "any" or "unknown" types. Strict mode throughout.
                    </li>
                  </ul>
                </div>
                <div className="relative rounded-2xl border border-border/50 bg-card/30 p-2 shadow-2xl backdrop-blur-sm">
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 opacity-50 blur" />
                  <div className="relative rounded-xl border border-border/50 bg-[#0A0A0A] p-6 text-sm text-muted-foreground font-mono leading-relaxed overflow-x-auto">
                    <span className="text-violet-400">export async function</span> <span className="text-blue-400">createIssue</span>(input: unknown) {'{\n'}
                    {'  '}const parsed = schema.<span className="text-blue-400">parse</span>(input);{'\n'}
                    {'  '}await <span className="text-emerald-400">requireWorkspaceMember</span>(workspaceId, userId);{'\n\n'}
                    {'  '}await db.<span className="text-blue-400">transaction</span>(async (tx) ={'>'} {'{\n'}
                    {'    '}await tx.<span className="text-blue-400">insert</span>(issues).<span className="text-blue-400">values</span>(parsed);{'\n'}
                    {'    '}await tx.<span className="text-blue-400">insert</span>(activityLog).<span className="text-blue-400">values</span>(...);{'\n'}
                    {'  }'});{'\n\n'}
                    {'  '}await <span className="text-blue-400">broadcast</span>(workspaceId, event);{'\n'}
                    {'}'}
                  </div>
                </div>
              </div>
           </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border/40 bg-card/10 py-24 text-center">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold tracking-tight mb-6">Ready to collaborate?</h2>
            <p className="text-muted-foreground mb-10">Experience the speed of Plane today.</p>
            <Button variant="premium" size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/sign-up">Start for free</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Plane. A multi-tenant showcase.</p>
      </footer>
    </div>
  );
}
