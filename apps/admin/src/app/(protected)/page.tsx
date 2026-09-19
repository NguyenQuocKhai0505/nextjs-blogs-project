"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FolderTree, Flag, FileText, Users } from "lucide-react"
import { authFetch } from "@/lib/auth-fetch"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/i18n/locale-context"
import { MiniBarChart } from "@/components/mini-bar-chart"

type DashboardSeries = {
  days: string[]
  users: number[]
  posts: number[]
  reports: number[]
}

type DashboardStats = {
  users: number
  posts: number
  categories: number
  pendingReports: number
  series?: DashboardSeries
}

const emptySeries = (): DashboardSeries => ({
  days: [],
  users: [],
  posts: [],
  reports: [],
})

export default function AdminDashboardPage() {
  const { t } = useLocale()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const cards = [
    {
      key: "categories" as const,
      label: t("dashboard.categories"),
      href: "/categories",
      icon: FolderTree,
    },
    {
      key: "posts" as const,
      label: t("dashboard.posts"),
      href: "/posts",
      icon: FileText,
    },
    {
      key: "users" as const,
      label: t("dashboard.users"),
      href: "/users",
      icon: Users,
    },
    {
      key: "pendingReports" as const,
      label: t("dashboard.pendingReports"),
      href: "/reports",
      icon: Flag,
    },
  ]

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
            typeof data?.message === "string"
              ? data.message
              : t("dashboard.loadFailed")
          )
        }
        const data = (await res.json()) as DashboardStats
        if (!cancelled) setStats(data)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("dashboard.loadFailed")
          )
          setStats(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  const series = stats?.series ?? emptySeries()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="admin-brand text-2xl font-bold tracking-tight">
          {t("dashboard.title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-[var(--admin-danger)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
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
                <Icon className="h-4 w-4 text-sky-500/80" />
              </div>
              <p className="admin-brand mt-3 text-3xl font-semibold tabular-nums text-[var(--admin-text)]">
                {loading ? "…" : (value ?? "—")}
              </p>
            </Link>
          )
        })}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--admin-text)]">
          {t("dashboard.chartsTitle")}
        </h3>
        <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
          {t("dashboard.chartsSubtitle")}
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {loading ? (
            <>
              <div className="h-48 animate-pulse rounded-2xl bg-[var(--admin-panel)]" />
              <div className="h-48 animate-pulse rounded-2xl bg-[var(--admin-panel)]" />
              <div className="h-48 animate-pulse rounded-2xl bg-[var(--admin-panel)]" />
            </>
          ) : (
            <>
              <MiniBarChart
                title={t("dashboard.chartUsers")}
                subtitle={t("dashboard.last7Days")}
                labels={series.days}
                values={series.users}
                color="#38bdf8"
                emptyLabel={t("dashboard.chartEmpty")}
              />
              <MiniBarChart
                title={t("dashboard.chartPosts")}
                subtitle={t("dashboard.last7Days")}
                labels={series.days}
                values={series.posts}
                color="#34d399"
                emptyLabel={t("dashboard.chartEmpty")}
              />
              <MiniBarChart
                title={t("dashboard.chartReports")}
                subtitle={t("dashboard.last7Days")}
                labels={series.days}
                values={series.reports}
                color="#fbbf24"
                emptyLabel={t("dashboard.chartEmpty")}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
