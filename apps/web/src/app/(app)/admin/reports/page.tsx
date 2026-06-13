"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Flag } from "lucide-react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import { useMe } from "@/lib/use-me"
import { useLocale } from "@/lib/i18n/locale-context"
import { formatDate } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ReportItem = {
  id: number
  targetKind: "POST" | "COMMENT" | "USER" | "REEL"
  targetId: string
  targetSlug?: string | null
  targetTitle?: string | null
  reason: string
  details: string | null
  status: "PENDING" | "REVIEWED" | "DISMISSED"
  createdAt: string
  reviewedAt: string | null
  reporter: { id: string; name: string; email: string; avatarUrl: string | null }
}

function targetLink(item: ReportItem): string | null {
  switch (item.targetKind) {
    case "POST":
      return item.targetSlug ? `/post/${item.targetSlug}` : null
    case "USER":
      return `/profile/${item.targetId}`
    case "REEL":
      return "/reels"
    default:
      return null
  }
}

export default function AdminReportsPage() {
  const router = useRouter()
  const { t } = useLocale()
  const [hasToken, setHasToken] = useState(false)
  useEffect(() => setHasToken(!!getAccessToken()), [])
  const { me, loading } = useMe(hasToken)
  const isAdmin = me?.role === "ADMIN"

  const [items, setItems] = useState<ReportItem[]>([])
  const [filter, setFilter] = useState<"ALL" | "PENDING">("PENDING")
  const [busyId, setBusyId] = useState<number | null>(null)

  const canRender = useMemo(() => !loading && hasToken, [loading, hasToken])

  const load = useCallback(async () => {
    const qs = filter === "PENDING" ? "?status=PENDING" : ""
    const res = await authFetch(`/reports${qs}`, { cache: "no-store" })
    if (!res.ok) {
      toast.error(t("report.loadFail"))
      return
    }
    const data = (await res.json()) as { items?: ReportItem[] }
    setItems(Array.isArray(data.items) ? data.items : [])
  }, [filter, t])

  useEffect(() => {
    if (canRender && isAdmin) void load()
  }, [canRender, isAdmin, load])

  useEffect(() => {
    if (canRender && !isAdmin) router.replace("/")
  }, [canRender, isAdmin, router])

  const updateStatus = async (id: number, status: "REVIEWED" | "DISMISSED") => {
    setBusyId(id)
    try {
      const res = await authFetch(`/reports/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("fail")
      toast.success(t("report.updateOk"))
      await load()
    } catch {
      toast.error(t("report.updateFail"))
    } finally {
      setBusyId(null)
    }
  }

  if (!hasToken) return null

  return (
    <main className="py-10">
      <div className="mx-auto max-w-4xl space-y-4 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              {t("report.adminTitle")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t("report.adminSubtitle")}</p>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant={filter === "PENDING" ? "default" : "outline"}
                onClick={() => setFilter("PENDING")}
              >
                {t("report.filterPending")}
              </Button>
              <Button
                size="sm"
                variant={filter === "ALL" ? "default" : "outline"}
                onClick={() => setFilter("ALL")}
              >
                {t("report.filterAll")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("report.empty")}</p>
            ) : (
              items.map((item) => {
                const href = targetLink(item)
                const targetLabel =
                  item.targetKind === "POST"
                    ? t("report.targetPost")
                    : item.targetKind === "COMMENT"
                      ? t("report.targetComment")
                      : item.targetKind === "USER"
                        ? t("report.targetUser")
                        : t("report.targetReel")

                return (
                  <div
                    key={item.id}
                    className="space-y-2 rounded-xl border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium">
                          #{item.id} · {targetLabel}
                          {item.targetTitle ? `: ${item.targetTitle}` : ` · ${item.targetId}`}
                        </p>
                        <p className="text-sm">
                          {t(`report.reasons.${item.reason}` as "report.reasons.SPAM")}
                        </p>
                        {item.details ? (
                          <p className="text-sm text-muted-foreground">{item.details}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {item.reporter.name} ({item.reporter.email}) · {formatDate(item.createdAt)}
                        </p>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {item.status}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {href ? (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={href}>{t("report.viewTarget")}</Link>
                          </Button>
                        ) : null}
                        {item.status === "PENDING" ? (
                          <>
                            <Button
                              size="sm"
                              disabled={busyId === item.id}
                              onClick={() => void updateStatus(item.id, "REVIEWED")}
                            >
                              {t("report.markReviewed")}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busyId === item.id}
                              onClick={() => void updateStatus(item.id, "DISMISSED")}
                            >
                              {t("report.dismiss")}
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
