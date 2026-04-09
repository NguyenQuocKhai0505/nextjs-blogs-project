import { cookies } from "next/headers"
import { apiUrl } from "@/lib/api"
import { ACCESS_TOKEN_COOKIE } from "@/lib/token"

export async function authFetchServer(path: string, init?: RequestInit) {
  const c = await cookies()
  const token = c.get(ACCESS_TOKEN_COOKIE)?.value
  const headers = new Headers(init?.headers)
  if (token) headers.set("authorization", `Bearer ${token}`)
  return fetch(apiUrl(path), { ...init, headers, cache: "no-store" })
}

