"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { authFetch } from "@/lib/auth-fetch"
import { cn } from "@/lib/utils"

type AuthorCard = {
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  postCount: number
  pendingReportedPostCount: number
}

function apiErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback
  const msg = (data as { message?: unknown }).message
  if (typeof msg === "string") return msg
  if (Array.isArray(msg)) return msg.map(String).join(", ")
  return fallback
}

export default function AdminPostsPage() {
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<AuthorCard[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load(search: string, pageNum: number) {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: "20",
      })
      if (search.trim()) params.set("q", search.trim())

      const res = await authFetch(`/admin/posts/by-user?${params}`, {
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrorMessage(data, "Load failed"))

      const list = Array.isArray(data.items) ? data.items : []
      setItems(
        list.map((r: Record<string, unknown>) => ({
          userId: String(r.userId ?? ""),
          name: String(r.name ?? ""),
          email: String(r.email ?? ""),
          avatarUrl: typeof r.avatarUrl === "string" ? r.avatarUrl : null,
          postCount: Number(r.postCount ?? 0),
          pendingReportedPostCount: Number(r.pendingReportedPostCount ?? 0),
        }))
      )
      setTotal(Number(data.total) || 0)
      setTotalPages(Number(data.totalPages) || 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed")
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void load(q, page)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page])

  const inputClass =
    "w-full max-w-md rounded-xl border border-[var(--admin-border)] bg-black/25 px-3 py-2 text-sm outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="admin-brand text-2xl font-bold tracking-tight">Posts</h2>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Authors who have posts — search by name or email. Red badge = posts with
          pending reports.
        </p>
      </div>

      <input
        className={inputClass}
        placeholder="Search name or email…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setPage(1)
        }}
      />

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
        <p className="text-sm text-[var(--admin-muted)]">No authors found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.userId}
              href={`/posts/users/${item.userId}`}
              className={cn(
                "relative block rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5",
                "transition hover:border-sky-500/40 hover:bg-[var(--admin-panel-2)]"
              )}
            >
              {item.pendingReportedPostCount > 0 ? (
                <span
                  className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white"
                  title="Posts with pending reports"
                >
                  {item.pendingReportedPostCount > 99
                    ? "99+"
                    : item.pendingReportedPostCount}
                </span>
              ) : null}

              <div className="flex items-center gap-3 pr-8">
                {item.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-500/20 text-sm font-semibold text-sky-300">
                    {item.name.slice(0, 1).toUpperCase() || "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{item.name}</p>
                  <p className="truncate text-sm text-[var(--admin-muted)]">
                    {item.email}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm tabular-nums text-sky-300">
                {item.postCount} {item.postCount === 1 ? "post" : "posts"}
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-[var(--admin-muted)]">
          {total} authors · page {page}/{totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            className="rounded-full border border-[var(--admin-border)] px-4 py-1.5 text-sm disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            className="rounded-full border border-[var(--admin-border)] px-4 py-1.5 text-sm disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
