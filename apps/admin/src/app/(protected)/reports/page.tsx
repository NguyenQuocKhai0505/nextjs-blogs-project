"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { authFetch } from "@/lib/auth-fetch"
import { cn } from "@/lib/utils"
import { useFeedback } from "@/components/feedback"

type Reporter = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

type TargetAuthor = {
  userId: string
  name: string
  email: string
  avatarUrl: string | null
}

type ReportItem = {
  id: number
  targetKind: string
  targetId: string
  targetSlug: string | null
  targetTitle: string | null
  targetDescription: string | null
  targetContent: string | null
  targetAuthor: TargetAuthor | null
  reason: string
  details: string | null
  status: string
  createdAt: string
  reviewedAt: string | null
  reporter: Reporter
}

function apiErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback
  const msg = (data as { message?: unknown }).message
  if (typeof msg === "string") return msg
  if (Array.isArray(msg)) return msg.map(String).join(", ")
  return fallback
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function AdminReportsPage() {
  const [status, setStatus] = useState("PENDING")
  const [items, setItems] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const { toast, confirm, prompt } = useFeedback()

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set("status", status)
      const res = await authFetch(`/reports?${params}`, { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrorMessage(data, "Load failed"))

      const list = Array.isArray(data.items) ? data.items : []
      setItems(
        list.map((r: Record<string, unknown>) => {
          const reporter = (r.reporter ?? {}) as Record<string, unknown>
          const author = r.targetAuthor as Record<string, unknown> | null
          return {
            id: Number(r.id),
            targetKind: String(r.targetKind ?? ""),
            targetId: String(r.targetId ?? ""),
            targetSlug:
              typeof r.targetSlug === "string" ? r.targetSlug : null,
            targetTitle:
              typeof r.targetTitle === "string" ? r.targetTitle : null,
            targetDescription:
              typeof r.targetDescription === "string"
                ? r.targetDescription
                : null,
            targetContent:
              typeof r.targetContent === "string" ? r.targetContent : null,
            targetAuthor:
              author && typeof author === "object"
                ? {
                    userId: String(author.userId ?? ""),
                    name: String(author.name ?? ""),
                    email: String(author.email ?? ""),
                    avatarUrl:
                      typeof author.avatarUrl === "string"
                        ? author.avatarUrl
                        : null,
                  }
                : null,
            reason: String(r.reason ?? ""),
            details: typeof r.details === "string" ? r.details : null,
            status: String(r.status ?? ""),
            createdAt: String(r.createdAt ?? ""),
            reviewedAt:
              typeof r.reviewedAt === "string" ? r.reviewedAt : null,
            reporter: {
              id: String(reporter.id ?? ""),
              name: String(reporter.name ?? ""),
              email: String(reporter.email ?? ""),
              avatarUrl:
                typeof reporter.avatarUrl === "string"
                  ? reporter.avatarUrl
                  : null,
            },
          }
        })
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  async function patchStatus(id: number, next: "REVIEWED" | "DISMISSED") {
    const res = await authFetch(`/reports/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(apiErrorMessage(data, "Update failed"))
  }

  /** Uphold: xóa bài (nếu POST) + warn author + đánh dấu REVIEWED */
  async function uphold(report: ReportItem) {
    const ok = await confirm({
      title: "Uphold this report?",
      description:
        "Mark as a valid violation. This may delete the post and warn the author.",
      confirmLabel: "Uphold",
      danger: true,
    })
    if (!ok) return

    setBusyId(report.id)
    setError(null)
    try {
      if (report.targetKind === "POST") {
        const postId = Number(report.targetId)
        if (Number.isFinite(postId) && postId > 0) {
          const del = await authFetch(`/admin/posts/${postId}`, {
            method: "DELETE",
          })
          const delData = await del.json().catch(() => ({}))
          // 404 = bài đã xóa — vẫn tiếp tục review
          if (!del.ok && del.status !== 404) {
            throw new Error(apiErrorMessage(delData, "Delete post failed"))
          }
        }

        if (report.targetAuthor?.userId) {
          const warnMsg = await prompt({
            title: "Warn the author",
            description: "Optional — cancel to skip sending a warning.",
            defaultValue:
              "Your content was removed for violating community guidelines.",
            confirmLabel: "Send warning",
            cancelLabel: "Skip warning",
          })
          if (warnMsg != null) {
            const w = await authFetch(
              `/admin/posts/by-user/${report.targetAuthor.userId}/warn`,
              {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  message: warnMsg.trim() || undefined,
                }),
              }
            )
            const wData = await w.json().catch(() => ({}))
            if (!w.ok) throw new Error(apiErrorMessage(wData, "Warn failed"))
          }
        }
      }

      await patchStatus(report.id, "REVIEWED")
      await load()
      toast.success("Report upheld.")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Uphold failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setBusyId(null)
    }
  }

  async function dismiss(report: ReportItem) {
    const ok = await confirm({
      title: "Dismiss this report?",
      description: "The content will stay published.",
      confirmLabel: "Dismiss",
    })
    if (!ok) return
    setBusyId(report.id)
    setError(null)
    try {
      await patchStatus(report.id, "DISMISSED")
      await load()
      toast.success("Report dismissed.")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Dismiss failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setBusyId(null)
    }
  }

  const selectClass =
    "rounded-xl border border-[var(--admin-border)] bg-black/25 px-3 py-2 text-sm outline-none focus:border-sky-500/60"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="admin-brand text-2xl font-bold tracking-tight">
          Reports
        </h2>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Review user reports — uphold (delete + warn) or dismiss.
        </p>
      </div>

      <select
        className={selectClass}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="PENDING">PENDING</option>
        <option value="REVIEWED">REVIEWED</option>
        <option value="DISMISSED">DISMISSED</option>
        <option value="">All</option>
      </select>

      {error ? (
        <p
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-[var(--admin-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">No reports.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((r) => {
            const open = !!expanded[r.id]
            const busy = busyId === r.id
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--admin-muted)]">
                      #{r.id} · {r.targetKind} · {formatDate(r.createdAt)}
                    </p>
                    <p className="mt-1 font-medium text-white">
                      Reason:{" "}
                      <span className="text-amber-200">{r.reason}</span>
                    </p>
                    {r.details ? (
                      <p className="mt-1 text-sm text-[var(--admin-muted)]">
                        “{r.details}”
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-[var(--admin-muted)]">
                      Reporter: {r.reporter.name} ({r.reporter.email})
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      r.status === "PENDING" &&
                        "bg-amber-500/20 text-amber-200",
                      r.status === "REVIEWED" &&
                        "bg-sky-500/20 text-sky-300",
                      r.status === "DISMISSED" && "bg-white/10 text-white/60"
                    )}
                  >
                    {r.status}
                  </span>
                </div>

                {r.targetKind === "POST" ? (
                  <div className="mt-4 rounded-xl border border-[var(--admin-border)]/80 bg-black/20 p-4">
                    <p className="font-medium text-white">
                      {r.targetTitle || `(post #${r.targetId})`}
                    </p>
                    {r.targetAuthor ? (
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">
                        Author:{" "}
                        <Link
                          href={`/users/${r.targetAuthor.userId}`}
                          className="text-sky-400 hover:underline"
                        >
                          {r.targetAuthor.name}
                        </Link>
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-red-300/80">
                        Post may already be deleted.
                      </p>
                    )}
                    {r.targetDescription ? (
                      <p className="mt-2 text-sm text-white/70">
                        {r.targetDescription}
                      </p>
                    ) : null}
                    {r.targetContent ? (
                      <>
                        <button
                          type="button"
                          className="mt-2 text-xs text-sky-400 hover:underline"
                          onClick={() =>
                            setExpanded((m) => ({ ...m, [r.id]: !open }))
                          }
                        >
                          {open ? "Hide content" : "Read full content"}
                        </button>
                        {open ? (
                          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-sm text-white/80">
                            {r.targetContent}
                          </pre>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[var(--admin-muted)]">
                    Target: {r.targetKind} / {r.targetId}
                  </p>
                )}

                {r.status === "PENDING" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void uphold(r)}
                      className="rounded-full bg-red-500/90 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Uphold (delete + warn)
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void dismiss(r)}
                      className="rounded-full border border-[var(--admin-border)] px-4 py-1.5 text-sm disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}