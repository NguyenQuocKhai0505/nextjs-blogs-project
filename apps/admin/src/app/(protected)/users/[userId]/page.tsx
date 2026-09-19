"use client"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { authFetch } from "@/lib/auth-fetch"
import { cn } from "@/lib/utils"
import { useFeedback } from "@/components/feedback"
type UserDetail = {
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  bio: string | null
  role: string
  emailVerified: boolean
  createdAt: string
  lastSeenAt: string | null
  postCount: number
  followerCount: number
  followingCount: number
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

export default function AdminUserDetailPage(){
  const params = useParams()
  const userId = typeof params.userId === "string" ? params.userId : ""
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast, prompt } = useFeedback()

  const load = useCallback(async () =>{
    if(!userId) return
    setError(null)
    setLoading(true)

    try{
      const res = await authFetch(`/admin/users/${userId}`,{
        cache:"no-store"
      })
      const data = await res.json().catch(() => ({}))
      if(!res.ok) throw new Error(apiErrorMessage(data, "Failed to load user data"))

      setUser({
        userId: String(data.userId ?? ""),
        name: String(data.name ?? ""),
        email: String(data.email ?? ""),
        avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null,
        bio: typeof data.bio === "string" ? data.bio : null,
        role: String(data.role ?? "USER"),
        emailVerified: Boolean(data.emailVerified),
        createdAt: String(data.createdAt ?? ""),
        lastSeenAt:
          typeof data.lastSeenAt === "string" ? data.lastSeenAt : null,
        postCount: Number(data.postCount ?? 0),
        followerCount: Number(data.followerCount ?? 0),
        followingCount: Number(data.followingCount ?? 0),
      })
    }catch(error){
      setError(error instanceof Error ? error.message : "An unknown error occurred")
      setUser(null)
    }finally{
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  async function warnUser() {
    const message = await prompt({
      title: "Warn user",
      description: "This sends an in-app warning notification to the user.",
      defaultValue:
        "Your content may violate community guidelines. Please review our rules.",
      confirmLabel: "Send warning",
    })
    if (message == null) return
    setBusy(true)
    setError(null)
    try {
      const res = await authFetch(`/admin/posts/by-user/${userId}/warn`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrorMessage(data, "Warn failed"))
      toast.success("Warning sent.")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Warn failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }
  if (loading) {
    return <p className="text-sm text-[var(--admin-muted)]">Loading…</p>
  }
  if (error && !user) {
    return (
      <div className="space-y-4">
        <Link href="/users" className="text-sm text-sky-400 hover:underline">
          ← Back to users
        </Link>
        <p className="text-sm text-[var(--admin-danger)]" role="alert">
          {error}
        </p>
      </div>
    )
  }
  if (!user) return null
  return (
    <div className="space-y-6">
      <Link href="/users" className="text-sm text-sky-400 hover:underline">
        ← Back to users
      </Link>
      {error ? (
        <p
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-[var(--admin-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6">
        <div className="flex flex-wrap items-start gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-sky-500/20 text-xl font-semibold text-sky-300">
              {user.name.slice(0, 1).toUpperCase() || "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="admin-brand text-2xl font-bold tracking-tight">
                {user.name}
              </h2>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  user.role === "ADMIN"
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-white/10 text-[var(--admin-muted)]"
                )}
              >
                {user.role}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">{user.email}</p>
            {user.bio ? (
              <p className="mt-3 text-sm text-white/80">{user.bio}</p>
            ) : null}
          </div>
        </div>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-[var(--admin-muted)]">Posts</dt>
            <dd className="tabular-nums text-sky-300">{user.postCount}</dd>
          </div>
          <div>
            <dt className="text-[var(--admin-muted)]">Followers</dt>
            <dd className="tabular-nums">{user.followerCount}</dd>
          </div>
          <div>
            <dt className="text-[var(--admin-muted)]">Following</dt>
            <dd className="tabular-nums">{user.followingCount}</dd>
          </div>
          <div>
            <dt className="text-[var(--admin-muted)]">Email verified</dt>
            <dd>{user.emailVerified ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-[var(--admin-muted)]">Joined</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[var(--admin-muted)]">Last seen</dt>
            <dd>{formatDate(user.lastSeenAt)}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/posts/users/${user.userId}`}
            className="rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm hover:border-sky-500/40"
          >
            View posts
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => void warnUser()}
            className="rounded-full bg-amber-500/90 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            Warn user
          </button>
        </div>
      </div>
    </div>
  )
}