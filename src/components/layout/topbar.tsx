"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { UserMenu } from "@/components/auth/user-menu";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { SidebarNavigation } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/use-i18n";

type TopbarProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
  eyebrow?: string;
};

export function Topbar({ title, description, actions, eyebrow }: TopbarProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { messages } = useI18n();

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-border/80 bg-background/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-8 md:flex-row md:items-center md:justify-between md:px-10 lg:px-14">
          <div className="flex items-start gap-3">
            <Sheet onOpenChange={setMobileNavOpen} open={mobileNavOpen}>
              <SheetTrigger asChild>
                <Button className="md:hidden" size="icon" variant="outline">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">{messages.nav.openNavigation}</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="border-border/80 bg-background/95" side="left">
                <SheetHeader>
                  <SheetTitle>{messages.nav.navigation}</SheetTitle>
                  <SheetDescription>{messages.nav.navigationDescription}</SheetDescription>
                </SheetHeader>
                <Separator className="my-5" />
                <SidebarNavigation onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="space-y-2">
              {eyebrow ? <Badge variant="secondary">{eyebrow}</Badge> : null}
              <div>
                <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{title}</h1>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            {actions}
            <LocaleSwitcher />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="border-b border-border/70 bg-muted/20 px-4 py-2 shadow-[inset_0_1px_0_0_hsl(var(--border)_/_0.4)] md:hidden">
        <SidebarNavigation inline />
      </div>
    </>
  );
}
