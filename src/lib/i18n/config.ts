export const locales = ["en", "hy"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "baghramyan-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const [, maybeLocale] = pathname.split("/");
  return isLocale(maybeLocale) ? maybeLocale : null;
}

export function stripLocaleFromPathname(pathname: string) {
  const locale = getLocaleFromPathname(pathname);

  if (!locale) {
    return pathname || "/";
  }

  const stripped = pathname.slice(`/${locale}`.length);
  return stripped || "/";
}

export function localizePath(locale: Locale, pathname: string) {
  const normalized = stripLocaleFromPathname(pathname);
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export function replaceLocaleInPathname(pathname: string, locale: Locale) {
  return localizePath(locale, pathname);
}

export function getIntlLocale(locale: Locale) {
  return locale === "hy" ? "hy-AM" : "en-US";
}

export function detectPreferredLocale(input?: { cookieLocale?: string | null; acceptLanguage?: string | null }) {
  if (isLocale(input?.cookieLocale)) {
    return input.cookieLocale;
  }

  const accepted = input?.acceptLanguage?.toLowerCase() ?? "";
  if (accepted.includes("hy")) {
    return "hy";
  }

  return defaultLocale;
}

export function persistLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LOCALE_COOKIE}=${locale}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`;
}
