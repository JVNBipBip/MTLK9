import { NextResponse, type NextRequest } from "next/server"
import {
  addLocaleToPathname,
  defaultLocale,
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
    pathname.startsWith("/ingest") ||
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

function rememberLocale(response: NextResponse, locale: string) {
  if (!isAppLocale(locale)) return
  response.cookies.set(localeCookieName, locale, {
    maxAge: ONE_YEAR,
    path: "/",
    sameSite: "lax",
  })
}

const CANONICAL_ORIGIN = "https://www.mtlcaninetraining.com"
const IMPACT_DASHBOARD_PATH = "/impact"
const ROBOTS_PRIVATE_VALUE = "noindex, nofollow, noarchive, nosnippet, noimageindex"

function isImpactDashboardPath(pathname: string) {
  return stripLocaleFromPathname(pathname) === IMPACT_DASHBOARD_PATH
}

function withPrivateRobotsHeaders(response: NextResponse) {
  response.headers.set("X-Robots-Tag", ROBOTS_PRIVATE_VALUE)
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

function unauthorizedImpactResponse() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="MTLK9 Impact", charset="UTF-8"',
      "X-Robots-Tag": ROBOTS_PRIVATE_VALUE,
      "Cache-Control": "private, no-store",
    },
  })
}

function notFoundImpactResponse() {
  return new NextResponse("Not found.", {
    status: 404,
    headers: {
      "X-Robots-Tag": ROBOTS_PRIVATE_VALUE,
      "Cache-Control": "private, no-store",
    },
  })
}

function isAuthorizedImpactRequest(request: NextRequest) {
  const password = process.env.IMPACT_DASHBOARD_PASSWORD
  if (!password) return process.env.NODE_ENV !== "production"

  const auth = request.headers.get("authorization") || ""
  const [scheme, credentials] = auth.split(" ")
  if (scheme !== "Basic" || !credentials) return false

  try {
    const decoded = atob(credentials)
    const separatorIndex = decoded.indexOf(":")
    if (separatorIndex === -1) return false
    const username = decoded.slice(0, separatorIndex)
    const providedPassword = decoded.slice(separatorIndex + 1)
    const expectedUsername = process.env.IMPACT_DASHBOARD_USER || "admin"
    return username === expectedUsername && providedPassword === password
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Legacy fr. subdomain → canonical host's French routes. This must live in
  // the middleware (not next.config redirects): on Vercel the middleware runs
  // before next.config redirects, so those rules never fire for fr. requests.
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0]
  if (host === "fr.mtlcaninetraining.com") {
    const stripped = stripLocaleFromPathname(pathname)
    const dest = new URL(stripped === "/" ? "/fr" : `/fr${stripped}`, CANONICAL_ORIGIN)
    dest.search = search
    return NextResponse.redirect(dest, 308)
  }

  if (host === "mtlcaninetraining.com") {
    const dest = new URL(pathname, CANONICAL_ORIGIN)
    if (!getPathLocale(pathname)) {
      dest.pathname = addLocaleToPathname(pathname, defaultLocale)
    }
    dest.search = search
    return NextResponse.redirect(dest, 308)
  }

  if (shouldSkip(pathname)) return NextResponse.next()

  const pathLocale = getPathLocale(pathname)
  const isImpactDashboard = isImpactDashboardPath(pathname)

  if (!pathLocale) {
    const url = request.nextUrl.clone()
    url.pathname = addLocaleToPathname(pathname, defaultLocale)

    const response = NextResponse.redirect(url, 308)
    rememberLocale(response, defaultLocale)
    return isImpactDashboard ? withPrivateRobotsHeaders(response) : response
  }

  const strippedPathname = stripLocaleFromPathname(pathname)
  if (strippedPathname === IMPACT_DASHBOARD_PATH) {
    if (!process.env.IMPACT_DASHBOARD_PASSWORD && process.env.NODE_ENV === "production") {
      return notFoundImpactResponse()
    }
    if (!isAuthorizedImpactRequest(request)) {
      return unauthorizedImpactResponse()
    }
  }

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
  return strippedPathname === IMPACT_DASHBOARD_PATH ? withPrivateRobotsHeaders(response) : response
}

export const config = {
  matcher: [
    "/",
    "/((?!api|_next|_vercel|images|videos|favicon.ico|robots.txt|sitemap.xml|.*\\..*).+)",
  ],
}
