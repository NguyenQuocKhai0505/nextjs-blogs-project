"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth-fetch"

export type Me = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  bio?: string | null
  createdAt: string
  role: "USER" | "ADMIN"
}

/**
 * Loads GET /me when enabled.
 * Important: while enabled flips on, we report loading=true immediately
 * (idle→loading) so AdminGuard does not treat "me=null" as unauthorized
 * and clear the token before /me returns.
 */
export function useMe(enabled: boolean) {
  const [me, setMe] = useState<Me | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")

  useEffect(() => {
    if (!enabled) {
      setMe(null)
      setStatus("idle")
      return
    }

    let cancelled = false
    setStatus("loading")

    ;(async () => {
      try {
        const res = await authFetch("/me", { cache: "no-store" })
        if (!res.ok) throw new Error("Unauthorized")
        const data = (await res.json()) as Me
        if (!cancelled) setMe(data)
      } catch {
        if (!cancelled) setMe(null)
      } finally {
        if (!cancelled) setStatus("done")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled])

  const loading = enabled && (status === "idle" || status === "loading")

  return { me, loading }
}
