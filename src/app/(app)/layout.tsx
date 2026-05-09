import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pl-[220px] min-h-screen min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}
