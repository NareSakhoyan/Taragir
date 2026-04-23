import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type AppShellProps = {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, description, eyebrow, actions, children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="bg-background/85">
        <SiteHeader actions={actions} description={description} eyebrow={eyebrow} title={title} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col">
            <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
              <div className="flex flex-col gap-4 md:gap-6">{children}</div>
            </main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
