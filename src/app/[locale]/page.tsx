import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { isLocale, localizePath } from "@/lib/i18n/config";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, ROUTES } from "@/lib/utils/constants";

type LocaleRootPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleRootPage({ params }: LocaleRootPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const cookieStore = await cookies();
  const hasSession =
    Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value) ||
    Boolean(cookieStore.get(REFRESH_TOKEN_COOKIE)?.value);

  redirect(localizePath(locale, hasSession ? ROUTES.dashboard : ROUTES.login));
}
