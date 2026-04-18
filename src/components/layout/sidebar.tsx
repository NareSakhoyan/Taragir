"use client";

import { BookMarked, BookText, Files, LayoutGrid, LibraryBig, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/use-i18n";
import { cn } from "@/lib/utils/classnames";
import { ROUTES } from "@/lib/utils/constants";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type SidebarProps = {
  className?: string;
};

type SidebarNavigationProps = {
  onNavigate?: () => void;
  className?: string;
  /** Horizontal pills for the mobile top strip */
  inline?: boolean;
};

export function SidebarNavigation({ onNavigate, className, inline = false }: SidebarNavigationProps) {
  const pathname = usePathname();
  const { href, messages } = useI18n();
  const appNavItems: NavItem[] = [
    {
      href: ROUTES.dashboard,
      label: messages.nav.dashboard,
      icon: LayoutGrid,
    },
    {
      href: ROUTES.documents,
      label: messages.nav.documents,
      icon: Files,
    },
    {
      href: ROUTES.lexicon,
      label: messages.nav.lexicon,
      icon: LibraryBig,
    },
    {
      href: ROUTES.lexemes,
      label: messages.nav.lexemes,
      icon: BookMarked,
    },
  ];

  return (
    <nav className={cn(inline ? "flex flex-wrap gap-2" : "space-y-1", className)}>
      {appNavItems.map((item) => {
        const localizedHref = href(item.href);
        const active = pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
        const Icon = item.icon;

        return (
          <Button
            asChild
            className={cn(
              inline
                ? "h-9 w-auto shrink-0 justify-center rounded-md px-3"
                : "h-10 w-full justify-start rounded-md px-3",
            )}
            key={item.href}
            onClick={onNavigate}
            variant={active ? "default" : "ghost"}
          >
            <Link href={localizedHref}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}

export function Sidebar({ className }: SidebarProps) {
  const { messages } = useI18n();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen w-[17rem] shrink-0 border-r border-border/80 bg-background/95 md:flex md:flex-col",
        className,
      )}
    >
      <div className="border-b border-border/70 px-5 py-7">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
          <BookText className="h-5 w-5" />
        </div>
        <div className="mt-5 space-y-1">
          <p className="font-serif text-xl font-semibold tracking-tight">Baghramyan</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{messages.metadata.description}</p>
        </div>
      </div>

      <Separator />

      <ScrollArea className="min-h-0 flex-1 px-3 py-4">
        <SidebarNavigation />
      </ScrollArea>
    </aside>
  );
}
