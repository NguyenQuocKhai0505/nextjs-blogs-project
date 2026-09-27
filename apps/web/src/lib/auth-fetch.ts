import { apiUrl } from "@/lib/api"
import { clearAccessToken, getAccessToken } from "@/lib/token"

// Must match the message thrown by JwtAuthGuard in apps/api. Other 401s
// (wrong password, invalid OTP) must not log the user out.
const SESSION_EXPIRED_MESSAGE = "Session expired. Please sign in again."

let redirectingToAuth = false

function handleSessionExpired() {
  if (typeof window === "undefined" || redirectingToAuth) return
  clearAccessToken()
  if (window.location.pathname.startsWith("/auth")) return
  redirectingToAuth = true
  window.location.assign("/auth")
}

export async function authFetch(path: string, init?: RequestInit) {
  const token = getAccessToken()
  const headers = new Headers(init?.headers)
  if (token) headers.set("authorization", `Bearer ${token}`)
  const res = await fetch(apiUrl(path), { ...init, headers })

  if (token && res.status === 401) {
    const body = (await res.clone().json().catch(() => null)) as { message?: unknown } | null
    if (body?.message === SESSION_EXPIRED_MESSAGE) handleSessionExpired()
  }

  return res
}
