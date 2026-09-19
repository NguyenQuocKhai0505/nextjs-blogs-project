"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { apiUrl } from "@/lib/api"
import { clearAccessToken, setAccessToken } from "@/lib/token"
import { PreferenceControls } from "@/components/preference-controls"
import { useLocale } from "@/lib/i18n/locale-context"

function errorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback
  const msg = (data as { message?: unknown }).message
  if (typeof msg === "string") return msg
  if (Array.isArray(msg)) return msg.map(String).join(", ")
  return fallback
}

export default function AdminLoginPage() {
  const router = useRouter()
  const { t } = useLocale()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function friendlyLoginError(err: unknown): string {
    if (!(err instanceof Error)) return t("login.failed")

    const raw = err.message.trim()
    const lower = raw.toLowerCase()

    if (
      lower === "failed to fetch" ||
      lower.includes("networkerror") ||
      lower.includes("load failed") ||
      lower.includes("network request failed")
    ) {
      return t("login.unreachable")
    }

    if (lower.includes("account does not exist")) {
      return t("login.noAccount")
    }
    if (lower.includes("incorrect password") || lower === "invalid credentials") {
      return t("login.badPassword")
    }
    if (lower.includes("not an admin")) {
      return t("login.notAdminRole")
    }
    if (
      lower.includes("password login not available") ||
      lower.includes("no password login")
    ) {
      return raw
    }
    if (lower.includes("must be an email") || lower.includes("email must")) {
      return t("login.email")
    }
    if (
      lower.includes("password") &&
      (lower.includes("longer") ||
        lower.includes("short") ||
        lower.includes("characters"))
    ) {
      return t("login.password")
    }

    return raw || t("login.failed")
  }

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
        throw new Error(errorMessage(data, t("login.failed")))
      }

      const token = (data as { accessToken?: string }).accessToken
      if (!token) throw new Error(t("login.missingToken"))
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
        throw new Error(t("login.profileFail"))
      }
      const me = (await meRes.json()) as { role?: string }
      if (me.role !== "ADMIN") {
        clearAccessToken()
        throw new Error(t("login.notAdmin"))
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
    <div className="relative">
      <div className="absolute right-0 top-0 z-10 -translate-y-2 translate-x-1 sm:translate-x-2">
        <PreferenceControls />
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-panel)] shadow-2xl shadow-sky-950/20">
        <div className="border-b border-[var(--admin-border)] bg-gradient-to-br from-sky-500/15 via-transparent to-transparent px-6 pb-5 pt-8 text-center">
          <div className="inline-flex flex-col items-center gap-2">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl ring-2 ring-sky-400/30">
              <Image
                src="/logo.png"
                alt="Ksocial"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="admin-brand text-2xl font-semibold text-[var(--admin-text)]">
              Ksocial
            </span>
          </div>
          <h1 className="admin-brand mt-4 text-xl font-bold tracking-tight text-sky-500">
            {t("login.title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {t("login.subtitle")}
          </p>
        </div>

        <form className="space-y-4 px-6 py-6" onSubmit={onSubmit}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--admin-muted)]">
              {t("login.email")}
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-soft)] px-3 py-2.5 text-sm outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--admin-muted)]">
              {t("login.password")}
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-soft)] px-3 py-2.5 text-sm outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
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
            {loading ? t("login.submitting") : t("login.submit")}
          </button>

          <p className="text-center text-xs text-[var(--admin-muted)]">
            {t("login.hint")}
          </p>
        </form>
      </div>
    </div>
  )
}
