/**
 * Admin API base URL.
 * DevOps: configure via env, never hardcode production hosts in source.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!raw) return "http://localhost:4000/v1"
  return raw.replace(/\/$/, "")
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl()
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}
