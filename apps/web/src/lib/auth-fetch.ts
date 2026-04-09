import { apiUrl } from "@/lib/api"
import { getAccessToken } from "@/lib/token"

export async function authFetch(path: string, init?: RequestInit) {
  const token = getAccessToken()
  const headers = new Headers(init?.headers)
  if (token) headers.set("authorization", `Bearer ${token}`)
  return fetch(apiUrl(path), { ...init, headers })
}

