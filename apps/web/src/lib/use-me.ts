"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth-fetch"

export type Me = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string
  role: "USER" | "ADMIN"
}

export function useMe(enabled: boolean) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setMe(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await authFetch("/me", { cache: "no-store" })
        if (!res.ok) throw new Error("Unauthorized")
        const data = (await res.json()) as Me
        if (!cancelled) setMe(data)
      } catch {
        if (!cancelled) setMe(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { me, loading }
}

