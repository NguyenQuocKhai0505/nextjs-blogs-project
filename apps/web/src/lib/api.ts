export function apiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL
  // Expected: http://localhost:4000/v1
  if (raw) return raw.replace(/\/+$/, "")
  // Dev-friendly default to avoid falling back to Next routes like /auth/google (404).
  // Use 127.0.0.1 to avoid IPv6 (::1) connection issues on some Windows setups.
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:4000/v1"
  return ""
}

export function apiUrl(path: string) {
  const base = apiBaseUrl()
  if (!base) return path
  if (!path.startsWith("/")) path = `/${path}`
  return `${base}${path}`
}

export function apiSocketUrl() {
  const base = apiBaseUrl()
  if (!base) return ""
  try {
    const u = new URL(base)
    u.pathname = ""
    u.search = ""
    u.hash = ""
    return u.toString().replace(/\/+$/, "")
  } catch {
    return base.replace(/\/v1\/?$/, "")
  }
}

