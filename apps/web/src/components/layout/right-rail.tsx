"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles, Users, MessageCircle } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"
import { authFetch } from "@/lib/auth-fetch"
import { apiUrl } from "@/lib/api"
import { getAccessToken } from "@/lib/token"
import { useMe } from "@/lib/use-me"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type FriendRow = {
  id: string
  name: string
  avatarUrl: string | null
  lastSeenAt: string | null
  isOnline: boolean
}

type SuggestedUser = {
  id: string
  name: string
  avatarUrl: string | null
}

const FRIENDS_POLL_MS = 45_000
const RELATIVE_TICK_MS = 30_000

function formatPresenceLine(
  isOnline: boolean,
  lastSeenAt: string | null,
  now: number,
  t: (key: string) => string
): string {
  if (isOnline) return t("rail.friendsOnline")
  if (!lastSeenAt) return t("rail.friendsOfflineUnknown")
  const diffSec = Math.max(0, Math.floor((now - new Date(lastSeenAt).getTime()) / 1000))
  if (diffSec < 60) return t("rail.friendsOfflineJustNow")
  const mins = Math.floor(diffSec / 60)
  if (mins < 60) return t("rail.friendsOfflineMinutes").replace("{n}", String(mins))
  const hours = Math.floor(mins / 60)
  if (hours < 48) return t("rail.friendsOfflineHours").replace("{n}", String(hours))
  const days = Math.floor(hours / 24)
  return t("rail.friendsOfflineDays").replace("{n}", String(days))
}

export default function RightRail() {
  const { t } = useLocale()
  const router = useRouter()
  const hasToken = Boolean(getAccessToken())
  const { me } = useMe(hasToken)
  const [friends, setFriends] = useState<FriendRow[]>([])
  const [friendsLoading, setFriendsLoading] = useState(true)
  const [friendsUnauthorized, setFriendsUnauthorized] = useState(false)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [suggested, setSuggested] = useState<SuggestedUser[]>([])
  const [suggestedLoading, setSuggestedLoading] = useState(true)
  const [followBusyId, setFollowBusyId] = useState<string | null>(null)

  const loadFriends = useCallback(async () => {
    if (!getAccessToken()) {
      setFriends([])
      setFriendsUnauthorized(false)
      setFriendsLoading(false)
      return
    }
    setFriendsLoading(true)
    const res = await authFetch("/me/mutual-friends/status", { cache: "no-store" })
    if (res.status === 401) {
      setFriendsUnauthorized(true)
      setFriends([])
      setFriendsLoading(false)
      return
    }
    setFriendsUnauthorized(false)
    if (!res.ok) {
      setFriends([])
      setFriendsLoading(false)
      return
    }
    const data = (await res.json()) as unknown
    if (!Array.isArray(data)) {
      setFriends([])
    } else {
      const rows: FriendRow[] = data
        .filter((r): r is Record<string, unknown> => r != null && typeof r === "object")
        .map((r) => ({
          id: String(r.id ?? ""),
          name: String(r.name ?? ""),
          avatarUrl: typeof r.avatarUrl === "string" ? r.avatarUrl : null,
          lastSeenAt: typeof r.lastSeenAt === "string" ? r.lastSeenAt : null,
          isOnline: Boolean(r.isOnline),
        }))
        .filter((r) => r.id.length > 0 && r.name.length > 0)
      setFriends(rows)
    }
    setFriendsLoading(false)
  }, [])

  const loadSuggested = useCallback(async () => {
    setSuggestedLoading(true)
    try {
      const res = await fetch(apiUrl("/users/discover?limit=8"), { cache: "no-store" })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as unknown
      if (!Array.isArray(data)) {
        setSuggested([])
        return
      }
      const rows: SuggestedUser[] = data
        .filter((r): r is Record<string, unknown> => r != null && typeof r === "object")
        .map((r) => ({
          id: String(r.id ?? ""),
          name: String(r.name ?? ""),
          avatarUrl: typeof r.avatarUrl === "string" ? r.avatarUrl : null,
        }))
        .filter((r) => r.id.length > 0 && r.name.length > 0)
      setSuggested(rows)
    } catch {
      setSuggested([])
    } finally {
      setSuggestedLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFriends()
  }, [loadFriends])

  useEffect(() => {
    void loadSuggested()
  }, [loadSuggested])

  useEffect(() => {
    const id = setInterval(() => void loadFriends(), FRIENDS_POLL_MS)
    return () => clearInterval(id)
  }, [loadFriends])

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), RELATIVE_TICK_MS)
    return () => clearInterval(id)
  }, [])

  const visibleFriends = useMemo(() => friends.slice(0, 12), [friends])
  const visibleSuggested = useMemo(
    () => suggested.filter((u) => u.id !== me?.id).slice(0, 5),
    [suggested, me?.id]
  )

  const onFollowSuggested = async (userId: string) => {
    if (!getAccessToken()) {
      toast.error(t("post.signInToast"))
      router.push("/auth")
      return
    }
    setFollowBusyId(userId)
    try {
      const res = await authFetch(`/users/${encodeURIComponent(userId)}/follow`, {
        method: "POST",
      })
      if (!res.ok) throw new Error()
      toast.success(t("rail.followed"))
      setSuggested((prev) => prev.filter((u) => u.id !== userId))
    } catch {
      toast.error(t("rail.followFail"))
    } finally {
      setFollowBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/15 p-1.5">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{t("rail.friendsTitle")}</CardTitle>
              <p className="text-xs font-normal text-muted-foreground">
                {t("rail.friendsSubtitle")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {friendsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border bg-muted/30 px-2 py-2"
                >
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : friendsUnauthorized ? (
            <p className="rounded-xl border border-dashed bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
              {t("rail.friendsSignInHint")}
            </p>
          ) : visibleFriends.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-background/50 p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("rail.friendsEmpty")}</p>
              <Button asChild size="sm" variant="secondary" className="mt-3 rounded-xl">
                <Link href="/discover">{t("rail.discover")}</Link>
              </Button>
            </div>
          ) : (
            <ul className="max-h-[min(420px,55vh)] space-y-1 overflow-y-auto pr-0.5">
              {visibleFriends.map((f) => {
                const initials = f.name
                  .split(/\s+/)
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
                const line = formatPresenceLine(f.isOnline, f.lastSeenAt, nowTick, t)
                return (
                  <li key={f.id}>
                    <div className="flex items-center gap-2 rounded-xl border border-transparent px-1 py-1.5 transition-colors hover:border-border/80 hover:bg-background/70">
                      <Link
                        href={`/profile/${encodeURIComponent(f.id)}`}
                        className="flex min-w-0 flex-1 items-center gap-2.5"
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10">
                            {f.avatarUrl ? (
                              <AvatarImage src={f.avatarUrl} alt="" />
                            ) : null}
                            <AvatarFallback className="text-xs font-semibold">
                              {initials || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full",
                              f.isOnline ? "ks-online-dot" : "bg-muted-foreground/50 ring-2 ring-card"
                            )}
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium leading-tight">{f.name}</p>
                          <p
                            className={cn(
                              "truncate text-[11px] leading-tight",
                              f.isOnline ? "text-[var(--online)]" : "text-muted-foreground"
                            )}
                          >
                            {line}
                          </p>
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-lg"
                        asChild
                        aria-label={t("rail.friendsChatAria")}
                      >
                        <Link href={`/contact?userId=${encodeURIComponent(f.id)}`}>
                          <MessageCircle className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {friends.length > 12 ? (
            <p className="pt-1 text-center text-[10px] text-muted-foreground">
              {t("rail.friendsShowing")
                .replace("{shown}", String(visibleFriends.length))
                .replace("{total}", String(friends.length))}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="ks-glass rounded-2xl py-0">
        <CardHeader className="px-4 pb-2 pt-4">
          <CardTitle className="text-sm font-semibold">{t("rail.suggested")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4">
          {suggestedLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                  <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : visibleSuggested.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("rail.suggestedEmpty")}</p>
          ) : (
            <ul className="space-y-1">
              {visibleSuggested.map((u) => {
                const initials = u.name
                  .split(/\s+/)
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
                return (
                  <li
                    key={u.id}
                    className="flex items-center gap-2 rounded-xl px-1 py-1 transition-colors hover:bg-background/60"
                  >
                    <Link
                      href={`/profile/${encodeURIComponent(u.id)}`}
                      className="flex min-w-0 flex-1 items-center gap-2"
                    >
                      <Avatar className="h-9 w-9">
                        {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt="" /> : null}
                        <AvatarFallback className="text-[10px] font-semibold">
                          {initials || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="truncate text-sm font-medium">{u.name}</p>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 rounded-lg px-2.5 text-xs"
                      disabled={followBusyId === u.id}
                      onClick={() => void onFollowSuggested(u.id)}
                    >
                      {t("rail.follow")}
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
          <Button asChild size="sm" variant="ghost" className="mt-1 h-8 w-full rounded-xl text-xs">
            <Link href="/discover">{t("rail.discover")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-primary/20 bg-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("rail.creatorMode")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("rail.creatorHint")}</p>
          <Button asChild size="sm" className="mt-3 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/post/create">{t("rail.createPost")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
