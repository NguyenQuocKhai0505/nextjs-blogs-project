const TOKEN_KEY = "ksocial_access_token"

export function getAccessToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

function setTokenCookie(token: string) {
  // Accessible to middleware/server via cookies (not httpOnly).
  // Keep it simple for dev; later we can move to httpOnly via Next route handler.
  const maxAge = 60 * 60 * 24 * 7 // 7 days
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(
    token
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

function clearTokenCookie() {
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function setAccessToken(token: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TOKEN_KEY, token)
  setTokenCookie(token)
}

export function clearAccessToken() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TOKEN_KEY)
  clearTokenCookie()
}

export const ACCESS_TOKEN_COOKIE = TOKEN_KEY

