"use client"

import { useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ReactionPicker } from "@/components/post/reaction-picker"
import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import type { ReelItem } from "@/lib/types/reels"
import { useLocale } from "@/lib/i18n/locale-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  reel: ReelItem
  active: boolean
  isOwn: boolean
  onDeleted: (id: number) => void
  onAuthRequired: () => void
  variant?: "page" | "overlay"
}

export function ReelItemCard({
  reel,
  active,
  isOwn,
  onDeleted,
  onAuthRequired,
  variant = "page",
}: Props) {
  const { t } = useLocale()
  const videoRef = useRef<HTMLVideoElement>(null)
  const viewSentRef = useRef(false)
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (active) {
      void video.play().catch(() => {})
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [active])

  const markViewed = useCallback(async () => {
    if (!getAccessToken() || viewSentRef.current) return
    viewSentRef.current = true
    try {
      await authFetch(`/reels/${reel.id}/view`, { method: "POST" })
    } catch {
      viewSentRef.current = false
    }
  }, [reel.id])

  useEffect(() => {
    if (!active) {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current)
        viewTimerRef.current = null
      }
      return
    }
    viewTimerRef.current = setTimeout(() => {
      void markViewed()
    }, 3000)
    return () => {
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current)
    }
  }, [active, markViewed])

  async function handleDelete() {
    if (!window.confirm(t("reels.deleteConfirm"))) return
    try {
      const res = await authFetch(`/reels/${reel.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("fail")
      toast.success(t("reels.deleted"))
      onDeleted(reel.id)
    } catch {
      toast.error(t("reels.deleteFail"))
    }
  }

  const isOverlay = variant === "overlay"

  return (
    <section
      className={cn(
        "relative w-full shrink-0 snap-start snap-always bg-black",
        isOverlay ? "h-full min-h-full" : "h-dvh"
      )}
      aria-label={reel.caption ?? t("reels.videoLabel")}
    >
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="absolute inset-0 h-full w-full object-contain"
        playsInline
        loop
        muted
        preload="metadata"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

      {!isOverlay ? (
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="pointer-events-auto rounded-full bg-black/40 px-3 py-1.5 text-sm font-medium backdrop-blur"
          >
            {t("reels.backHome")}
          </Link>
          <Link
            href="/reels/create"
            className="pointer-events-auto rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
          >
            {t("reels.create")}
          </Link>
        </div>
      ) : (
        <div className="absolute right-0 top-0 z-10 flex items-center justify-end px-4 py-3">
          <Link
            href="/reels/create"
            className="pointer-events-auto rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
          >
            {t("reels.create")}
          </Link>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between gap-4 p-4 pb-8">
        <div className="pointer-events-auto min-w-0 flex-1 space-y-3">
          <Link href={`/profile/${reel.author.id}`} className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/30 bg-muted">
              {reel.author.avatarUrl ? (
                <Image
                  src={reel.author.avatarUrl}
                  alt={reel.author.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-sm font-semibold">
                  {reel.author.name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <span className="truncate text-sm font-semibold">{reel.author.name}</span>
          </Link>

          {reel.caption ? (
            <p className="line-clamp-3 text-sm text-white/90">{reel.caption}</p>
          ) : null}

          <div className="flex items-center gap-2 text-xs text-white/80">
            <Eye className="h-3.5 w-3.5" />
            <span>{reel.viewCount.toLocaleString()} {t("reels.views")}</span>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-3">
          <ReactionPicker
            reelId={reel.id}
            initialCount={reel.likeCount}
            size="md"
            className={cn("[&_button]:border-white/30 [&_button]:bg-black/40 [&_button]:text-white")}
            onAuthRequired={onAuthRequired}
          />
          {isOwn ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full border-white/30 bg-black/40 text-white hover:bg-black/60"
              onClick={() => void handleDelete()}
              aria-label={t("reels.delete")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
