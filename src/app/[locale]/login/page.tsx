"use client";

import { useSearchParams } from "next/navigation";

import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { LoginForm } from "@/components/auth/login-form";
import { useI18n } from "@/lib/i18n/use-i18n";
import { REDIRECT_QUERY_PARAM, ROUTES } from "@/lib/utils/constants";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const { href } = useI18n();
  const redirectTo = searchParams.get(REDIRECT_QUERY_PARAM) || href(ROUTES.dashboard);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4 md:right-6 md:top-6">
        <LocaleSwitcher />
      </div>
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}
