"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { ReelItemCard } from "@/components/reels/reel-item"
import { apiUrl } from "@/lib/api"
import { getAccessToken } from "@/lib/token"
import type { ReelFeed, ReelItem } from "@/lib/types/reels"
import { useLocale } from "@/lib/i18n/locale-context"
import { useMe } from "@/lib/use-me"
import { Button } from "@/components/ui/button"

function parseFeed(data: unknown): ReelFeed {
  const row = data as Record<string, unknown>
  const items = Array.isArray(row.items) ? (row.items as ReelItem[]) : []
  const nextCursor =
    typeof row.nextCursor === "number" ? row.nextCursor : null
  return { items, nextCursor }
}

export function ReelsClient({
  variant = "page",
  onClose,
}: {
  variant?: "page" | "overlay"
  onClose?: () => void
}) {
  const router = useRouter()
  const { t } = useLocale()
  const hasToken = !!getAccessToken()
  const { me } = useMe(hasToken)

  const [items, setItems] = useState<ReelItem[]>([])
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  const loadingMoreRef = useRef(false)

  const loadFeed = useCallback(async (cursor?: number) => {
    const qs = new URLSearchParams({ take: "10" })
    if (cursor != null) qs.set("cursor", String(cursor))
    const res = await fetch(apiUrl(`/reels/feed?${qs.toString()}`), {
      cache: "no-store",
    })
    if (!res.ok) throw new Error("feed fail")
    return parseFeed(await res.json())
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const feed = await loadFeed()
        if (cancelled) return
        setItems(feed.items)
        setNextCursor(feed.nextCursor)
      } catch {
        if (!cancelled) toast.error(t("reels.loadFail"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadFeed, t])

  useEffect(() => {
    const root = scrollerRef.current
    if (!root || items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const idx = itemRefs.current.findIndex((el) => el === entry.target)
          if (idx >= 0) setActiveIndex(idx)
        }
      },
      { root, threshold: 0.65 }
    )

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [items])

  useEffect(() => {
    const root = scrollerRef.current
    if (!root || nextCursor == null) return

    async function onScroll() {
      if (loadingMoreRef.current || nextCursor == null) return
      const nearBottom =
        root!.scrollTop + root!.clientHeight >= root!.scrollHeight - 120
      if (!nearBottom) return

      loadingMoreRef.current = true
      setLoadingMore(true)
      try {
        const feed = await loadFeed(nextCursor)
        setItems((prev) => [...prev, ...feed.items])
        setNextCursor(feed.nextCursor)
      } catch {
        toast.error(t("reels.loadFail"))
      } finally {
        loadingMoreRef.current = false
        setLoadingMore(false)
      }
    }

    root.addEventListener("scroll", onScroll, { passive: true })
    return () => root.removeEventListener("scroll", onScroll)
  }, [loadFeed, nextCursor, t])

  function handleDeleted(id: number) {
    setItems((prev) => {
      const next = prev.filter((r) => r.id !== id)
      setActiveIndex((i) => Math.min(i, Math.max(0, next.length - 1)))
      return next
    })
  }

  function handleAuthRequired() {
    toast.message(t("reels.loginRequired"))
    router.push("/auth")
  }

  const isOverlay = variant === "overlay"

  if (loading) {
    return (
      <div className={isOverlay ? "grid h-full place-items-center" : "grid h-dvh place-items-center"}>
        <Loader2 className="h-8 w-8 animate-spin text-white/70" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        className={
          isOverlay
            ? "grid h-full place-items-center px-6 text-center"
            : "grid h-dvh place-items-center px-6 text-center"
        }
      >
        <div className="space-y-4">
          <p className="text-lg font-semibold">{t("reels.emptyTitle")}</p>
          <p className="text-sm text-white/70">{t("reels.emptyHint")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/reels/create">{t("reels.createFirst")}</Link>
            </Button>
            {isOverlay && onClose ? (
              <Button
                variant="outline"
                className="border-white/30 bg-transparent text-white"
                onClick={onClose}
              >
                {t("reels.close")}
              </Button>
            ) : (
              <Button asChild variant="outline" className="border-white/30 bg-transparent text-white">
                <Link href="/">{t("reels.backHome")}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={isOverlay ? "relative h-full overflow-hidden" : "relative h-dvh overflow-hidden"}>
      <div
        ref={scrollerRef}
        className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        {items.map((reel, index) => (
          <div
            key={reel.id}
            ref={(el) => {
              itemRefs.current[index] = el
            }}
            className={isOverlay ? "h-full snap-start snap-always" : undefined}
          >
            <ReelItemCard
              reel={reel}
              active={index === activeIndex}
              isOwn={me?.id === reel.author.id}
              onDeleted={handleDeleted}
              onAuthRequired={handleAuthRequired}
              variant={variant}
            />
          </div>
        ))}
      </div>

      {loadingMore ? (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
          <Loader2 className="h-5 w-5 animate-spin text-white/70" />
        </div>
      ) : null}
    </div>
  )
}
