import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { hasAuthCookies } from "@/lib/auth/middleware-auth";
import {
  detectPreferredLocale,
  getLocaleFromPathname,
  isLocale,
  localizePath,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n/config";
import { REDIRECT_QUERY_PARAM, ROUTES } from "@/lib/utils/constants";

function preferredLocale(request: NextRequest): Locale {
  return detectPreferredLocale({
    cookieLocale: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
  });
}

function redirect(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function pathWithoutLocale(pathname: string, locale: Locale) {
  const stripped = pathname.slice(`/${locale}`.length);
  return stripped || "/";
}

function isLoginPath(pathWithoutLocale: string) {
  return pathWithoutLocale === ROUTES.login || pathWithoutLocale.startsWith(`${ROUTES.login}/`);
}

function defaultAuthenticatedPath(locale: Locale) {
  return localizePath(locale, ROUTES.documents);
}

function defaultGuestPath(locale: Locale) {
  return localizePath(locale, ROUTES.login);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const session = hasAuthCookies(request);
  const localeInPath = getLocaleFromPathname(pathname);

  if (pathname === "/") {
    const locale = preferredLocale(request);
    return redirect(
      request,
      session ? defaultAuthenticatedPath(locale) : defaultGuestPath(locale),
    );
  }

  if (!localeInPath) {
    const locale = preferredLocale(request);
    return redirect(request, localizePath(locale, pathname));
  }

  const firstSegment = pathname.split("/")[1];
  if (firstSegment && !isLocale(firstSegment)) {
    const locale = preferredLocale(request);
    const rest = pathname.slice(`/${firstSegment}`.length) || "/";
    return redirect(request, localizePath(locale, rest));
  }

  const locale = localeInPath;
  const localizedPath = pathWithoutLocale(pathname, locale);

  if (localizedPath === "/") {
    return redirect(
      request,
      session ? defaultAuthenticatedPath(locale) : defaultGuestPath(locale),
    );
  }

  if (isLoginPath(localizedPath)) {
    if (session) {
      return redirect(request, defaultAuthenticatedPath(locale));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL(defaultGuestPath(locale), request.url);
    loginUrl.searchParams.set(REDIRECT_QUERY_PARAM, `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
