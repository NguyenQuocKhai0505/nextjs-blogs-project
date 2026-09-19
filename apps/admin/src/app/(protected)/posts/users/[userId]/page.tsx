"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { authFetch } from "@/lib/auth-fetch"
import { cn } from "@/lib/utils"
import { useFeedback } from "@/components/feedback"
import { useLocale } from "@/lib/i18n/locale-context"

type AuthorProfile = {
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  postCount: number
  pendingReportedPostCount: number
}

type AuthorPost = {
  id: number
  title: string
  description: string
  content: string
  slug: string
  createdAt: string
  pendingReportCount: number
}

function apiErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback
  const msg = (data as { message?: unknown }).message
  if (typeof msg === "string") return msg
  if (Array.isArray(msg)) return msg.map(String).join(", ")
  return fallback
}

export default function AdminUserPostsPage() {
  const { t } = useLocale()
  const params = useParams()
  const userId = typeof params.userId === "string" ? params.userId : ""

  const [user, setUser] = useState<AuthorProfile | null>(null)
  const [posts, setPosts] = useState<AuthorPost[]>([])
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast, confirm, prompt } = useFeedback()

  const load = useCallback(async () => {
    if (!userId) return
    setError(null)
    setLoading(true)
    try {
      const res = await authFetch(`/admin/posts/by-user/${userId}`, {
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrorMessage(data, "Load failed"))

      const u = data.user as Record<string, unknown> | undefined
      if (!u || typeof u !== "object") throw new Error("Invalid response")

      setUser({
        userId: String(u.userId ?? ""),
        name: String(u.name ?? ""),
        email: String(u.email ?? ""),
        avatarUrl: typeof u.avatarUrl === "string" ? u.avatarUrl : null,
        postCount: Number(u.postCount ?? 0),
        pendingReportedPostCount: Number(u.pendingReportedPostCount ?? 0),
      })

      const list = Array.isArray(data.posts) ? data.posts : []
      setPosts(
        list.map((r: Record<string, unknown>) => ({
          id: Number(r.id),
          title: String(r.title ?? ""),
          description: String(r.description ?? ""),
          content: String(r.content ?? ""),
          slug: String(r.slug ?? ""),
          createdAt: String(r.createdAt ?? ""),
          pendingReportCount: Number(r.pendingReportCount ?? 0),
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed")
      setUser(null)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  async function deletePost(postId: number) {
    const ok = await confirm({
      title: t("posts.deleteConfirm"),
      description: t("posts.deleteDesc"),
      confirmLabel: t("common.delete"),
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    setError(null)
    try {
      const res = await authFetch(`/admin/posts/${postId}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrorMessage(data, "Delete failed"))
      await load()
      toast.success(t("posts.deleted"))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  async function warnUser() {
    const message = await prompt({
      title: t("users.warnTitle"),
      description: t("users.warnDesc"),
      defaultValue: t("users.warnDefault"),
      confirmLabel: t("users.sendWarning"),
    })
    if (message == null) return
    setBusy(true)
    setError(null)
    try {
      const res = await authFetch(`/admin/posts/by-user/${userId}/warn`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: message.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrorMessage(data, "Warn failed"))
      toast.success(t("users.warnSent"))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Warn failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/posts"
          className="text-sm text-sky-500 hover:underline"
        >
          {t("posts.backAuthors")}
        </Link>
        {user ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void warnUser()}
            className="rounded-full border border-amber-500/50 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-200"
          >
            {t("users.warn")}
          </button>
        ) : null}
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
        <p className="text-sm text-[var(--admin-muted)]">{t("common.loading")}</p>
      ) : !user ? (
        <p className="text-sm text-[var(--admin-muted)]">{t("posts.notFound")}</p>
      ) : (
        <>
          <div className="relative rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
            {user.pendingReportedPostCount > 0 ? (
              <span className="absolute right-4 top-4 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {user.pendingReportedPostCount}
              </span>
            ) : null}
            <div className="flex items-center gap-4 pr-10">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-full bg-sky-500/20 text-lg font-semibold text-sky-500">
                  {user.name.slice(0, 1).toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="admin-brand truncate text-2xl font-bold tracking-tight">
                  {user.name}
                </h2>
                <p className="truncate text-sm text-[var(--admin-muted)]">
                  {user.email}
                </p>
                <p className="mt-1 text-sm text-sky-500">
                  {user.postCount}{" "}
                  {user.postCount === 1 ? t("posts.post") : t("posts.posts")}
                  {user.pendingReportedPostCount > 0
                    ? ` · ${user.pendingReportedPostCount} ${t("posts.pendingWith")}`
                    : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">
              {t("nav.posts")}
            </h3>
            {posts.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">
                {t("posts.emptyPosts")}
              </p>
            ) : (
              posts.map((post) => {
                const open = !!expanded[post.id]
                return (
                  <div
                    key={post.id}
                    className={cn(
                      "rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4",
                      post.pendingReportCount > 0 && "border-red-500/40"
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-[var(--admin-text)]">
                            {post.title}
                          </p>
                          {post.pendingReportCount > 0 ? (
                            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-300">
                              {post.pendingReportCount}{" "}
                              {post.pendingReportCount === 1
                                ? t("posts.pendingReport")
                                : t("posts.pendingReports")}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[var(--admin-muted)]">
                          {post.description}
                        </p>
                        <p className="mt-1 text-xs text-[var(--admin-muted)]">
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleString()
                            : ""}{" "}
                          · /{post.slug}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-[var(--admin-border)] px-3 py-1 text-xs hover:border-sky-500/50"
                          onClick={() =>
                            setExpanded((prev) => ({
                              ...prev,
                              [post.id]: !prev[post.id],
                            }))
                          }
                        >
                          {open
                            ? t("posts.hideContent")
                            : t("posts.viewContent")}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded-full border border-red-500/40 px-3 py-1 text-xs text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-300"
                          onClick={() => void deletePost(post.id)}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </div>
                    {open ? (
                      <div className="mt-3 whitespace-pre-wrap rounded-lg border border-[var(--admin-border)] bg-[var(--admin-soft)] p-3 text-sm text-[var(--admin-text)]">
                        {post.content || "(empty)"}
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
