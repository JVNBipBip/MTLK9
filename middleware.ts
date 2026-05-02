import { NextResponse, type NextRequest } from "next/server"
import {
  addLocaleToPathname,
  defaultLocale,
  detectLocaleFromAcceptLanguage,
  getPathLocale,
  isAppLocale,
  localeCookieName,
  localeHeaderName,
  pathnameHeaderName,
  stripLocaleFromPathname,
} from "@/lib/i18n/config"

const ONE_YEAR = 60 * 60 * 24 * 365

function hasPublicFileExtension(pathname: string) {
  return /\.[^/]+$/.test(pathname)
}

function shouldSkip(pathname: string) {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/videos") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    hasPublicFileExtension(pathname)
  )
}

function resolveLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get(localeCookieName)?.value
  if (isAppLocale(cookieLocale)) return cookieLocale
  return detectLocaleFromAcceptLanguage(request.headers.get("accept-language")) || defaultLocale
}

function rememberLocale(response: NextResponse, locale: string) {
  if (!isAppLocale(locale)) return
  response.cookies.set(localeCookieName, locale, {
    maxAge: ONE_YEAR,
    path: "/",
    sameSite: "lax",
  })
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (shouldSkip(pathname)) return NextResponse.next()

  const pathLocale = getPathLocale(pathname)

  if (!pathLocale) {
    const locale = resolveLocale(request)
    const url = request.nextUrl.clone()
    url.pathname = addLocaleToPathname(pathname, locale)

    const response = NextResponse.redirect(url)
    rememberLocale(response, locale)
    return response
  }

  const strippedPathname = stripLocaleFromPathname(pathname)
  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = strippedPathname
  rewriteUrl.search = search

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(localeHeaderName, pathLocale)
  requestHeaders.set(pathnameHeaderName, pathname)

  const response = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  })
  rememberLocale(response, pathLocale)
  return response
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|images|videos|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
}
