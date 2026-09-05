"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FolderTree, Flag, FileText, Users } from "lucide-react"
import { authFetch } from "@/lib/auth-fetch"
import { cn } from "@/lib/utils"

type DashboardStats = {
  users: number
  posts: number
  categories: number
  pendingReports: number
}

const CARDS = [
  { key: "categories" as const, label: "Categories", href: "/categories", icon: FolderTree },
  { key: "posts" as const, label: "Posts", href: "/posts", icon: FileText },
  { key: "users" as const, label: "Users", href: "/users", icon: Users },
  {
    key: "pendingReports" as const,
    label: "Pending reports",
    href: "/reports",
    icon: Flag,
  },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await authFetch("/admin/dashboard", { cache: "no-store" })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(
            typeof data?.message === "string" ? data.message : `HTTP ${res.status}`
          )
        }
        const data = (await res.json()) as DashboardStats
        if (!cancelled) setStats(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard")
          setStats(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="admin-brand text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Overview of platform content and moderation queue.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-[var(--admin-danger)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon
          const value = stats?.[card.key]
          return (
            <Link
              key={card.key}
              href={card.href}
              className={cn(
                "rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5 transition",
                "hover:border-sky-500/40 hover:bg-[var(--admin-panel-2)]"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--admin-muted)]">{card.label}</p>
                <Icon className="h-4 w-4 text-sky-400/80" />
              </div>
              <p className="admin-brand mt-3 text-3xl font-semibold tabular-nums">
                {loading ? "…" : value ?? "—"}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
