import { cookies } from "next/headers"
import { ACCESS_TOKEN_COOKIE } from "@/lib/token"

export async function getAccessTokenFromCookies() {
  const c = await cookies()
  return c.get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

