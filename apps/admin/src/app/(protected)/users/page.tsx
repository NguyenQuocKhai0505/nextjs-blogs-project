"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { authFetch } from "@/lib/auth-fetch"
import { cn } from "@/lib/utils"

type UserRow = {
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  role: string
  postCount: number
  createdAt: string
  lastSeenAt: string | null
}

function apiErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback
  const msg = (data as { message?: unknown }).message
  if (typeof msg === "string") return msg
  if (Array.isArray(msg)) return msg.map(String).join(", ")
  return fallback
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return "—"
  }
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("")
  const [role, setRole] = useState("") // "" | "USER" | "ADMIN"
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<UserRow[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load(search: string, roleFilter: string, pageNum: number) {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: "20",
      })
      if (search.trim()) params.set("q", search.trim())
      if (roleFilter === "USER" || roleFilter === "ADMIN") {
        params.set("role", roleFilter)
      }

      const res = await authFetch(`/admin/users?${params}`, {
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
          role: String(r.role ?? "USER"),
          postCount: Number(r.postCount ?? 0),
          createdAt: String(r.createdAt ?? ""),
          lastSeenAt:
            typeof r.lastSeenAt === "string" ? r.lastSeenAt : null,
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
      void load(q, role, page)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, role, page])

  const inputClass =
    "rounded-xl border border-[var(--admin-border)] bg-black/25 px-3 py-2 text-sm outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="admin-brand text-2xl font-bold tracking-tight">Users</h2>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          All accounts — search by name/email, filter by role.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className={cn(inputClass, "w-full max-w-md")}
          placeholder="Search name or email…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
        />
        <select
          className={inputClass}
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All roles</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

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
        <p className="text-sm text-[var(--admin-muted)]">No users found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--admin-border)] bg-black/20 text-[var(--admin-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Posts</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr
                  key={u.userId}
                  className="border-b border-[var(--admin-border)]/60 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/users/${u.userId}`}
                      className="flex items-center gap-3 hover:opacity-90"
                    >
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatarUrl}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-sky-500/20 text-xs font-semibold text-sky-300">
                          {u.name.slice(0, 1).toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{u.name}</p>
                        <p className="truncate text-xs text-[var(--admin-muted)]">
                          {u.email}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        u.role === "ADMIN"
                          ? "bg-sky-500/20 text-sky-300"
                          : "bg-white/10 text-[var(--admin-muted)]"
                      )}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-sky-300">
                    {u.postCount}
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">
                    {formatDate(u.lastSeenAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-[var(--admin-muted)]">
          {total} users · page {page}/{totalPages}
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