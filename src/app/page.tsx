import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { detectPreferredLocale, LOCALE_COOKIE, localizePath } from "@/lib/i18n/config";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, ROUTES } from "@/lib/utils/constants";

export default async function HomePage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = detectPreferredLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerStore.get("accept-language"),
  });
  const hasSession =
    Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value) ||
    Boolean(cookieStore.get(REFRESH_TOKEN_COOKIE)?.value);

  redirect(localizePath(locale, hasSession ? ROUTES.words : ROUTES.login));
}
