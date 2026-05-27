"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type AppShellProps = {
  title: string;
  description: string;
  eyebrow?: string;
  requiredRole?: "admin";
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, description, eyebrow, requiredRole, actions, children }: AppShellProps) {
  return (
    <AuthGuard requiredRole={requiredRole}>
      <SidebarProvider
        defaultOpen
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 64)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <SiteHeader actions={actions} description={description} eyebrow={eyebrow} title={title} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="@container/main flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex min-w-0 flex-col gap-4 py-4 md:gap-6 md:py-6 px-6">{children}</div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
