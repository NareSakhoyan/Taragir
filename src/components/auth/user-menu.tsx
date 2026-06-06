"use client";

import { LogOut, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuthSession } from "@/lib/hooks/use-auth-session";
import { useI18n } from "@/lib/i18n/use-i18n";
import { clearRememberedDocumentJobs, persistSessionCookies } from "@/lib/supabase/session";
import { ROUTES } from "@/lib/utils/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ViewMode } from "@/components/auth/auth-provider";

export function UserMenu() {
  const router = useRouter();
  const { isAccountAdmin, setViewMode, supabase, user, viewMode } = useAuthSession();
  const { href, messages } = useI18n();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "U";

  function switchViewMode(nextViewMode: string) {
    if (nextViewMode !== "admin" && nextViewMode !== "normal") {
      return;
    }

    const typedViewMode = nextViewMode as ViewMode;
    setViewMode(typedViewMode);
    router.replace(href(typedViewMode === "admin" ? ROUTES.dashboard : ROUTES.documents));
  }

  async function signOut() {
    await supabase.auth.signOut();
    persistSessionCookies(null);
    clearRememberedDocumentJobs();
    router.replace(href(ROUTES.login));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="rounded-full border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus-visible:ring-1 focus-visible:ring-sidebar-ring"
          size="icon"
          variant="ghost"
        >
          <Avatar className="h-9 w-9 border-0">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{user?.email ?? messages.auth.unknownUser}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAccountAdmin ? (
          <>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              {messages.auth.viewMode}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup onValueChange={switchViewMode} value={viewMode}>
              <DropdownMenuRadioItem value="admin">{messages.auth.adminView}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="normal">{messages.auth.normalView}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onSelect={signOut}>
          <LogOut className="h-4 w-4" />
          {messages.auth.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
