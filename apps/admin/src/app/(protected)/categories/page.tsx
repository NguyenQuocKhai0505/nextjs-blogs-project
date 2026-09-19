"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth-fetch"
import { cn } from "@/lib/utils"
import { useFeedback } from "@/components/feedback"
import { useLocale } from "@/lib/i18n/locale-context"

type Category = {
  id: number
  name: string
  slug: string
  sortOrder: number
}

function apiErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback
  const msg = (data as { message?: unknown }).message
  if (typeof msg === "string") return msg
  if (Array.isArray(msg)) return msg.map(String).join(", ")
  return fallback
}

export default function AdminCategoriesPage() {
  const { t } = useLocale()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast, confirm } = useFeedback()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [sortOrder, setSortOrder] = useState("0")

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editSlug, setEditSlug] = useState("")
  const [editSort, setEditSort] = useState("0")

  async function load() {
    setError(null)
    try {
      const res = await authFetch("/admin/categories", { cache: "no-store" })
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error(apiErrorMessage(data, "Load failed"))
      if (!Array.isArray(data)) {
        setCategories([])
        return
      }
      const parsed: Category[] = data
        .filter((r): r is Record<string, unknown> => r != null && typeof r === "object")
        .map((r) => ({
          id: Number(r.id),
          name: String(r.name ?? ""),
          slug: String(r.slug ?? ""),
          sortOrder: Number(r.sortOrder ?? 0),
        }))
        .filter((c) => Number.isFinite(c.id) && c.id > 0 && c.name.length > 0)
      setCategories(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed")
      setCategories([])
    }
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [])

  async function create() {
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await authFetch("/admin/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() ? slug.trim() : undefined,
          sortOrder: Number.parseInt(sortOrder || "0", 10) || 0,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrorMessage(data, "Create failed"))
      setName("")
      setSlug("")
      setSortOrder("0")
      await load()
      toast.success(t("categories.created"))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number) {
    const ok = await confirm({
      title: t("categories.deleteConfirm"),
      description: t("categories.deleteDesc"),
      confirmLabel: t("common.delete"),
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    setError(null)
    try {
      const res = await authFetch(`/admin/categories/${id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrorMessage(data, "Delete failed"))
      await load()
      toast.success(t("categories.deleted"))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id)
    setEditName(c.name)
    setEditSlug(c.slug)
    setEditSort(String(c.sortOrder))
  }

  async function saveEdit() {
    if (editingId == null || !editName.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await authFetch(`/admin/categories/${editingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim() ? editSlug.trim() : undefined,
          sortOrder: Number.parseInt(editSort || "0", 10) || 0,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrorMessage(data, "Update failed"))
      setEditingId(null)
      await load()
      toast.success(t("categories.updated"))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-soft)] px-3 py-2 text-sm outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"

  return (
    <div className="space-y-8">
      <h2 className="admin-brand text-2xl font-bold tracking-tight">
        {t("categories.title")}
      </h2>

      {error ? (
        <p
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-[var(--admin-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form
        className="space-y-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5"
        onSubmit={(e) => {
          e.preventDefault()
          void create()
        }}
      >
        <h3 className="text-sm font-semibold text-[var(--admin-text)]">
          {t("categories.create")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--admin-muted)]">
              {t("categories.name")}
            </span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--admin-muted)]">
              {t("categories.slugOptional")}
            </span>
            <input
              className={inputClass}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={busy}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--admin-muted)]">
              {t("categories.sortOrder")}
            </span>
            <input
              className={inputClass}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              disabled={busy}
              inputMode="numeric"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
        >
          {busy ? t("categories.saving") : t("categories.createBtn")}
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--admin-text)]">
          {t("categories.all")}
        </h3>
        {loading ? (
          <p className="text-sm text-[var(--admin-muted)]">{t("common.loading")}</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-[var(--admin-muted)]">{t("categories.empty")}</p>
        ) : (
          categories.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4",
                "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              )}
            >
              {editingId === c.id ? (
                <div className="grid w-full gap-3 sm:grid-cols-3">
                  <input
                    className={inputClass}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={busy}
                  />
                  <input
                    className={inputClass}
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    disabled={busy}
                  />
                  <input
                    className={inputClass}
                    value={editSort}
                    onChange={(e) => setEditSort(e.target.value)}
                    disabled={busy}
                    inputMode="numeric"
                  />
                  <div className="flex gap-2 sm:col-span-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveEdit()}
                      className="rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
                    >
                      {t("common.save")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditingId(null)}
                      className="rounded-full px-4 py-1.5 text-sm text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--admin-text)]">
                      {c.name}
                    </p>
                    <p className="truncate text-xs text-[var(--admin-muted)]">
                      {c.slug} · {t("categories.sort")} {c.sortOrder}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => startEdit(c)}
                      className="rounded-lg px-3 py-1.5 text-sm text-sky-500 hover:bg-sky-500/10 disabled:opacity-60"
                    >
                      {t("categories.edit")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void remove(c.id)}
                      className="rounded-lg px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-60"
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
