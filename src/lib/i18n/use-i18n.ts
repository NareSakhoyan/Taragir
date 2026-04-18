"use client";

import { useParams } from "next/navigation";

import { defaultLocale, getLocaleFromPathname, isLocale, localizePath, type Locale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/messages";

export function useI18n() {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return {
    locale,
    messages: dictionaries[locale],
    href(pathname: string) {
      return localizePath(locale, pathname);
    },
  };
}

export function getPathLocale(pathname: string): Locale {
  return getLocaleFromPathname(pathname) ?? defaultLocale;
}
