"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { apiUrl, getApiBaseUrl } from "@/lib/api"
import { clearAccessToken, setAccessToken } from "@/lib/token"

function errorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback
  const msg = (data as { message?: unknown }).message
  if (typeof msg === "string") return msg
  if (Array.isArray(msg)) return msg.map(String).join(", ")
  return fallback
}

/** Map API / network errors to clear UI copy. */
function friendlyLoginError(err: unknown): string {
  if (!(err instanceof Error)) return "Login failed"

  const raw = err.message.trim()
  const lower = raw.toLowerCase()

  if (
    lower === "failed to fetch" ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("network request failed")
  ) {
    return `Cannot reach API (${getApiBaseUrl()}). Start the API (port 4000) and open admin at http://localhost:3001.`
  }

  if (lower.includes("account does not exist")) {
    return "Account does not exist. Check the email, or create/promote an ADMIN in the database."
  }
  if (lower.includes("incorrect password") || lower === "invalid credentials") {
    return "Incorrect password. Please try again."
  }
  if (lower.includes("not an admin")) {
    return "This account is not an admin. Promote the user role to ADMIN in the database."
  }
  if (lower.includes("password login not available") || lower.includes("no password login")) {
    return raw
  }
  if (lower.includes("must be an email") || lower.includes("email must")) {
    return "Please enter a valid email address."
  }
  if (lower.includes("password") && (lower.includes("longer") || lower.includes("short") || lower.includes("characters"))) {
    return "Password must be at least 6 characters."
  }

  return raw || "Login failed"
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let res: Response
      try {
        res = await fetch(apiUrl("/auth/login"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
      } catch (networkErr) {
        throw new Error(
          networkErr instanceof Error ? networkErr.message : "Failed to fetch"
        )
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(errorMessage(data, "Login failed"))
      }

      const token = (data as { accessToken?: string }).accessToken
      if (!token) throw new Error("Missing access token from server")
      setAccessToken(token)

      let meRes: Response
      try {
        meRes = await fetch(apiUrl("/me"), {
          headers: { authorization: `Bearer ${token}` },
          cache: "no-store",
        })
      } catch {
        clearAccessToken()
        throw new Error("Failed to fetch")
      }

      if (!meRes.ok) {
        clearAccessToken()
        throw new Error("Could not load profile. Token may be invalid.")
      }
      const me = (await meRes.json()) as { role?: string }
      if (me.role !== "ADMIN") {
        clearAccessToken()
        throw new Error("This account is not an admin")
      }

      router.replace("/")
      router.refresh()
    } catch (err) {
      setError(friendlyLoginError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-panel)] shadow-2xl shadow-sky-950/40">
      <div className="border-b border-[var(--admin-border)] bg-gradient-to-br from-sky-500/15 via-transparent to-transparent px-6 pb-5 pt-8 text-center">
        <div className="inline-flex flex-col items-center gap-2">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl ring-2 ring-sky-400/30">
            <Image src="/logo.png" alt="Ksocial" fill className="object-cover" priority />
          </div>
          <span className="admin-brand text-2xl font-semibold text-white">Ksocial</span>
        </div>
        <h1 className="admin-brand mt-4 text-xl font-bold tracking-tight text-sky-300">
          Admin sign in
        </h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Control plane — ADMIN role required
        </p>
      </div>

      <form className="space-y-4 px-6 py-6" onSubmit={onSubmit}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--admin-muted)]">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--admin-border)] bg-black/25 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--admin-muted)]">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--admin-border)] bg-black/25 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>

        {error ? (
          <p
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-[var(--admin-danger)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-full bg-sky-500 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-center text-xs text-[var(--admin-muted)]">
          Use an account with <span className="text-sky-400">ADMIN</span> role.
          Regular users are blocked.
        </p>
      </form>
    </div>
  )
}
