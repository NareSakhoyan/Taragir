import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

type AppShellProps = {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, description, eyebrow, actions, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar actions={actions} description={description} eyebrow={eyebrow} title={title} />
        <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 md:px-10 lg:px-14 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
