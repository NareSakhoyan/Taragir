"use client";

import Link from "next/link";
import { BookMarked, BookText, Clock3, Files, LayoutGrid, LibraryBig, Search, Type, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { UserMenu } from "@/components/auth/user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ROUTES } from "@/lib/utils/constants";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

function SidebarNavList({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { href } = useI18n();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const localizedHref = href(item.href);
        const isActive = pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
        const Icon = item.icon;

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
              <Link
                href={localizedHref}
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { href, messages } = useI18n();

  const primaryItems: NavItem[] = [
    { href: ROUTES.dashboard, label: messages.nav.dashboard, icon: LayoutGrid },
    { href: ROUTES.documents, label: messages.nav.documents, icon: Files },
    { href: ROUTES.words, label: messages.nav.words, icon: Type },
    { href: ROUTES.lexicon, label: messages.nav.lexicon, icon: LibraryBig },
    { href: ROUTES.lexemes, label: messages.nav.lexemes, icon: BookMarked },
    { href: ROUTES.references, label: messages.nav.references, icon: BookText },
    { href: ROUTES.referenceMatching, label: messages.nav.referenceMatching, icon: Search },
    { href: ROUTES.jobs, label: messages.nav.jobs, icon: Clock3 },
  ];

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader className="gap-3 p-3">
        <Link
          className="block rounded-xl border border-sidebar-border/70 bg-sidebar-accent/50 px-3 py-3 transition-colors hover:bg-sidebar-accent/80 group-data-[collapsible=icon]:hidden"
          href={href(ROUTES.words)}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <BookText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">Baghramyan</p>
                <Badge className="border-sidebar-border bg-sidebar text-sidebar-foreground" variant="outline">
                  OCR
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-sidebar-foreground/70">
                {messages.metadata.description}
              </p>
            </div>
          </div>
        </Link>

        <Link
          aria-label="Baghramyan"
          className="hidden items-center justify-center rounded-lg border border-sidebar-border/70 bg-sidebar/80 p-0 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8"
          href={href(ROUTES.words)}
        >
          <BookText className="h-4 w-4" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{messages.nav.navigation}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNavList items={primaryItems} />
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 p-3 group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sidebar-foreground/60">
            Reviewer Flow
          </p>
          <p className="mt-2 text-sm text-sidebar-foreground/80">
            Words, evidence, and curated lexemes stay reviewable from their sources.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <LocaleSwitcher />
            <UserMenu />
          </div>
        </div>

        <div className="hidden justify-center group-data-[collapsible=icon]:flex">
          <UserMenu />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
