import { NextResponse } from "next/server"

import { apiBaseUrl, apiUrl } from "@/lib/api"

/**
 * Start Google OAuth on the Nest API. Visiting /auth/google on the web host
 * redirects there instead of 404 (when NEXT_PUBLIC_API_URL is set).
 */
export function GET(request: Request) {
  if (!apiBaseUrl()) {
    const u = new URL("/auth", request.url)
    u.searchParams.set("error", "missing_api_url")
    return NextResponse.redirect(u)
  }
  return NextResponse.redirect(apiUrl("/auth/google"))
}
