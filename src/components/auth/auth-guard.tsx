"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAuthSession } from "@/lib/hooks/use-auth-session";
import { useI18n } from "@/lib/i18n/use-i18n";
import { REDIRECT_QUERY_PARAM, ROUTES } from "@/lib/utils/constants";

type AuthGuardProps = {
  children: React.ReactNode;
  requiredRole?: "admin";
};

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAdmin, isLoading, isProfileLoading, session } = useAuthSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { href, messages } = useI18n();

  useEffect(() => {
    if (isLoading || session) {
      return;
    }

    const redirectUrl = new URLSearchParams();
    redirectUrl.set(REDIRECT_QUERY_PARAM, `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
    router.replace(`${href(ROUTES.login)}?${redirectUrl.toString()}`);
  }, [href, isLoading, pathname, router, searchParams, session]);

  useEffect(() => {
    if (isLoading || isProfileLoading || !session || requiredRole !== "admin" || isAdmin) {
      return;
    }

    router.replace(href(ROUTES.documents));
  }, [href, isAdmin, isLoading, isProfileLoading, requiredRole, router, session]);

  if (isLoading || !session || (session && isProfileLoading) || (requiredRole === "admin" && !isAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="flex items-center gap-3 rounded-md border border-border/80 bg-background/90 px-5 py-3 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {messages.auth.checkingSession}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
