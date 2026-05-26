import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";

function detectLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale;
  }

  const acceptLanguage = request.headers.get("accept-language") ?? "";
  for (const part of acceptLanguage.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase();
    const base = tag.split("-")[0];
    if ((locales as readonly string[]).includes(base)) {
      return base as Locale;
    }
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (pathnameHasLocale) return NextResponse.next();

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|rss.xml|.*\\..*).*)",
  ],
};
