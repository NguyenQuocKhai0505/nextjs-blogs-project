"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { clearAccessToken, getAccessToken } from "@/lib/token"
import { useMe, type Me } from "@/lib/use-me"

type AdminSessionValue = {
  me: Me
}

const AdminSessionContext = createContext<AdminSessionValue | null>(null)

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext)
  if (!ctx) throw new Error("useAdminSession must be used within AdminGuard")
  return ctx
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    setHasToken(!!getAccessToken())
    setReady(true)
  }, [])

  const { me, loading } = useMe(ready && hasToken)

  useEffect(() => {
    if (!ready) return
    if (!hasToken) {
      router.replace("/login")
      return
    }
    // Wait until /me finishes — do not clear token while still loading
    if (loading) return
    if (!me || me.role !== "ADMIN") {
      clearAccessToken()
      router.replace("/login")
    }
  }, [ready, hasToken, loading, me, router])

  const value = useMemo(() => (me ? { me } : null), [me])

  if (!ready || !hasToken || loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500/30 border-t-sky-400" />
          <p className="text-sm text-[var(--admin-muted)]">Checking access…</p>
        </div>
      </div>
    )
  }

  if (!me || me.role !== "ADMIN" || !value) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-[var(--admin-muted)]">Redirecting to login…</p>
      </div>
    )
  }

  return (
    <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
  )
}
