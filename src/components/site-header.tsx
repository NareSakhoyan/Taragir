"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { UserMenu } from "@/components/auth/user-menu";

type SiteHeaderProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
  eyebrow?: string;
};

export function SiteHeader({ title, description, actions, eyebrow }: SiteHeaderProps) {
  return (
    <header className="flex shrink-0 flex-col gap-4 border-b border-border/70 bg-background/80 px-4 py-4 backdrop-blur-sm transition-[width,height] ease-linear md:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3">
          <SidebarTrigger className="mt-0.5" />
          <Separator className="hidden h-8 md:block" orientation="vertical" />
          <div className="min-w-0">
            {eyebrow ? <Badge variant="secondary">{eyebrow}</Badge> : null}
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          {actions}
          <LocaleSwitcher />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
