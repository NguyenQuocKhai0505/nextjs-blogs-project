export function apiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL
  // Expected: http://localhost:4000/v1
  return raw ? raw.replace(/\/+$/, "") : ""
}

export function apiUrl(path: string) {
  const base = apiBaseUrl()
  if (!base) return path // fallback for local Next routes
  if (!path.startsWith("/")) path = `/${path}`
  return `${base}${path}`
}

