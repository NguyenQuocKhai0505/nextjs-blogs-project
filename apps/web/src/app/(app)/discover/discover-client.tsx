"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, Loader2 } from "lucide-react"

import { AdminVerifiedBadge } from "@/components/user/admin-verified-badge"
import { apiUrl } from "@/lib/api"
import { getAccessToken } from "@/lib/token"
import { useMe } from "@/lib/use-me"
import { useLocale } from "@/lib/i18n/locale-context"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type DiscoverUser = {
  id: string
  name: string
  avatarUrl: string | null
  role?: string
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function DiscoverClient() {
  const { t } = useLocale()
  const searchParams = useSearchParams()
  const hasToken = !!getAccessToken()
  const { me } = useMe(hasToken)
  const [query, setQuery] = useState(() => searchParams.get("q")?.trim() ?? "")
  const [debounced, setDebounced] = useState("")
  const [users, setUsers] = useState<DiscoverUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    const q = searchParams.get("q")?.trim()
    if (q != null && q.length > 0) setQuery(q)
  }, [searchParams])

  const load = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (q) qs.set("q", q)
      qs.set("limit", "80")
      const res = await fetch(apiUrl(`/users/discover?${qs.toString()}`), {
        cache: "no-store",
      })
      if (!res.ok) {
        setUsers([])
        return
      }
      const data = (await res.json()) as unknown
      const list = Array.isArray(data) ? data : []
      setUsers(
        list
          .filter((u): u is Record<string, unknown> => u != null && typeof u === "object")
          .map((u) => ({
            id: String(u.id ?? ""),
            name: String(u.name ?? ""),
            avatarUrl: u.avatarUrl == null ? null : String(u.avatarUrl),
            role: typeof u.role === "string" ? u.role : undefined,
          }))
          .filter((u) => u.id.length > 0 && u.name.length > 0)
      )
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(debounced)
  }, [debounced, load])

  const visible = useMemo(
    () => (me?.id ? users.filter((u) => u.id !== me.id) : users),
    [users, me?.id]
  )

  return (
    <div className="space-y-5 py-1">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t("discover.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("discover.subtitle")}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("discover.searchPlaceholder")}
          className="h-11 rounded-full border-border bg-muted/40 pl-10"
          aria-label={t("discover.searchPlaceholder")}
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {!debounced ? (
        <p className="text-xs text-muted-foreground">{t("discover.browseHint")}</p>
      ) : null}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{t("discover.listTitle")}</h2>
        {!loading && visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{t("discover.empty")}</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {visible.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/profile/${encodeURIComponent(u.id)}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 transition-colors",
                    "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/10">
                    {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt="" /> : null}
                    <AvatarFallback>{initials(u.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate font-medium">
                    <span className="truncate">{u.name}</span>
                    {u.role === "ADMIN" ? (
                      <AdminVerifiedBadge label={t("user.adminVerified")} />
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
