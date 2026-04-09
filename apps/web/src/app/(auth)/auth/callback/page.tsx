"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { setAccessToken } from "@/lib/token"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      setAccessToken(token)
      // If opened from a popup, notify opener then close.
      if (typeof window !== "undefined" && window.opener) {
        try {
          window.opener.postMessage({ type: "OAUTH_TOKEN", token }, "*")
        } finally {
          window.close()
        }
        return
      }

      router.replace("/")
      router.refresh()
      return
    }
    router.replace("/auth")
  }, [router, searchParams])

  return (
    <div className="text-sm text-muted-foreground">
      Completing sign-in...
    </div>
  )
}

