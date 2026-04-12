"use client"

import { useEffect, useRef } from "react"
import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"

const INTERVAL_MS = 60_000

/** Keeps `lastSeenAt` fresh so mutual friends see you as online (with chat socket or alone). */
export function PresenceHeartbeat() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const ping = () => {
      if (!getAccessToken()) return
      void authFetch("/me/presence", { method: "POST" })
    }
    ping()
    intervalRef.current = setInterval(ping, INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return null
}
