"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useAuthSession } from "@/lib/hooks/use-auth-session";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ROUTES } from "@/lib/utils/constants";
import { Button } from "@/components/ui/button";

type LoginFormProps = {
  redirectTo: string;
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const { isLoading, session, supabase } = useAuthSession();
  const { href, messages } = useI18n();
  const [, startTransition] = useTransition();
  const [oauthPending, setOauthPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const safeRedirectPath = useCallback(() => {
    const fallbackPath = href(ROUTES.dashboard);

    if (typeof window === "undefined" || !redirectTo) {
      return fallbackPath;
    }

    try {
      const url = new URL(redirectTo, window.location.origin);

      if (url.origin !== window.location.origin) {
        return fallbackPath;
      }

      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return fallbackPath;
    }
  }, [href, redirectTo]);

  useEffect(() => {
    if (!isLoading && session) {
      startTransition(() => {
        router.replace(safeRedirectPath());
      });
    }
  }, [isLoading, router, safeRedirectPath, session]);

  function buildOAuthRedirectUrl() {
    return new URL(safeRedirectPath(), window.location.origin).toString();
  }

  async function onGoogleSignIn() {
    setFormError(null);
    setOauthPending(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildOAuthRedirectUrl(),
      },
    });
    if (error) {
      setFormError(messages.login.oauthError);
      setOauthPending(false);
    }
  }

  const busy = isLoading || oauthPending;

  return (
    <div className="w-full max-w-md border-y border-border/80 bg-background/90 px-8 py-10 shadow-[0_24px_64px_-24px_rgba(51,40,27,0.25)] sm:border-x sm:rounded-md">
      <div className="space-y-1 border-b border-border/70 pb-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{messages.login.formTitle}</h1>
        <p className="text-sm text-muted-foreground">{messages.login.formDescription}</p>
      </div>

      <div className="space-y-4 pt-8">
        <Button
          className="w-full gap-2"
          disabled={busy}
          onClick={() => void onGoogleSignIn()}
          type="button"
          variant="outline"
        >
          {oauthPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          {messages.login.continueWithGoogle}
        </Button>

        {formError ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
