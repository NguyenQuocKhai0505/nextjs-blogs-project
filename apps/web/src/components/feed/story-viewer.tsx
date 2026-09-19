"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Eye, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth-fetch"
import type { StoryGroup, StoryItem } from "@/lib/types/stories"
import { useLocale } from "@/lib/i18n/locale-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const IMAGE_DURATION_MS = 5000

type Props = {
  groups: StoryGroup[]
  startGroupIndex: number
  viewerId: string | null
  onClose: () => void
  onRefresh: () => void
  onAddStory?: () => void
}

export function StoryViewer({
  groups,
  startGroupIndex,
  viewerId,
  onClose,
  onRefresh,
  onAddStory,
}: Props) {
  const { t } = useLocale()
  const [groupIndex, setGroupIndex] = useState(startGroupIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [viewersOpen, setViewersOpen] = useState(false)
  const [viewers, setViewers] = useState<
    { user: { id: string; name: string; avatarUrl: string | null }; viewedAt: string }[]
  >([])
  const [viewerCount, setViewerCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const group = groups[groupIndex]
  const story = group?.stories[storyIndex]
  const isOwn = group?.isOwn ?? false

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const markViewed = useCallback(
    async (item: StoryItem) => {
      if (!viewerId || isOwn) return
      try {
        await authFetch(`/stories/${item.id}/view`, { method: "POST" })
      } catch {
        /* ignore */
      }
    },
    [viewerId, isOwn]
  )

  const goNext = useCallback(() => {
    if (!group) return
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1)
      setProgress(0)
      return
    }
    if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1)
      setStoryIndex(0)
      setProgress(0)
      return
    }
    onClose()
    onRefresh()
  }, [group, storyIndex, groupIndex, groups.length, onClose, onRefresh])

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1)
      setProgress(0)
      return
    }
    if (groupIndex > 0) {
      const prev = groups[groupIndex - 1]
      setGroupIndex((i) => i - 1)
      setStoryIndex(Math.max(0, prev.stories.length - 1))
      setProgress(0)
    }
  }, [storyIndex, groupIndex, groups])

  useEffect(() => {
    if (!story) return
    void markViewed(story)
  }, [story, markViewed])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.body.dataset.ksStoryOpen = "true"
    return () => {
      document.body.style.overflow = prevOverflow
      delete document.body.dataset.ksStoryOpen
    }
  }, [])

  useEffect(() => {
    clearTimer()
    if (!story) return

    if (story.mediaType === "VIDEO") {
      setProgress(0)
      return
    }

    const started = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - started
      const pct = Math.min(100, (elapsed / IMAGE_DURATION_MS) * 100)
      setProgress(pct)
      if (elapsed >= IMAGE_DURATION_MS) {
        clearTimer()
        goNext()
      }
    }, 50)

    return clearTimer
  }, [story, groupIndex, storyIndex, goNext, clearTimer])

  async function loadViewers() {
    if (!story) return
    try {
      const res = await authFetch(`/stories/${story.id}/views`)
      if (!res.ok) throw new Error()
      const data = (await res.json()) as {
        count: number
        viewers: typeof viewers
      }
      setViewerCount(data.count)
      setViewers(data.viewers ?? [])
      setViewersOpen(true)
    } catch {
      toast.error(t("stories.viewersFail"))
    }
  }

  async function deleteStory() {
    if (!story) return
    try {
      const res = await authFetch(`/stories/${story.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success(t("stories.deleted"))
      onClose()
      onRefresh()
    } catch {
      toast.error(t("stories.deleteFail"))
    }
  }

  const handleClose = useCallback(() => {
    onClose()
    onRefresh()
  }, [onClose, onRefresh])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
      if (e.key === "ArrowRight") goNext()
      if (e.key === "ArrowLeft") goPrev()
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [handleClose, goNext, goPrev])

  if (!group || !story) return null

  return createPortal(
    <>
      <div
        className="ks-story-overlay fixed inset-0 flex items-center justify-center px-2"
        style={{ zIndex: 99999 }}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/85 backdrop-blur-[2px]"
          onClick={handleClose}
          aria-label={t("stories.close")}
        />

        <div className="relative z-10 aspect-[9/16] h-[min(92dvh,880px)] w-full max-w-[420px] overflow-hidden bg-zinc-950 shadow-2xl ring-1 ring-white/10 md:rounded-2xl">
          {/* Full-bleed media */}
          <div className="absolute inset-0">
            {story.mediaType === "IMAGE" && story.imageUrl ? (
              <Image
                src={story.imageUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
                priority
                sizes="420px"
              />
            ) : null}
            {story.mediaType === "VIDEO" && story.videoUrl ? (
              <video
                ref={videoRef}
                src={story.videoUrl}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                onEnded={goNext}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget
                  if (v.duration) {
                    setProgress((v.currentTime / v.duration) * 100)
                  }
                }}
              />
            ) : null}
            {story.mediaType === "TEXT" ? (
              <div
                className="flex h-full w-full items-center justify-center p-8"
                style={{ backgroundColor: story.backgroundColor ?? "#3b82f6" }}
              >
                <p className="max-w-sm text-center text-2xl font-semibold leading-snug text-white drop-shadow-md">
                  {story.textContent}
                </p>
              </div>
            ) : null}
          </div>

          {/* Top / bottom readability gradients */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/70 via-black/25 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Progress bars */}
          <div className="absolute left-0 right-0 top-0 z-40 flex gap-1 px-3 pt-3">
            {group.stories.map((s, i) => (
              <div
                key={s.id}
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35"
              >
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-75 ease-linear"
                  style={{
                    width:
                      i < storyIndex
                        ? "100%"
                        : i === storyIndex
                          ? `${progress}%`
                          : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute left-0 right-0 top-8 z-40 flex items-center gap-2 px-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <Avatar className="h-9 w-9 shrink-0 ring-2 ring-white/40">
                <AvatarImage src={group.user.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-white/20 text-xs text-white">
                  {group.user.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white drop-shadow">
                  {group.user.name}
                </p>
                <p className="text-xs text-white/80 drop-shadow">
                  {new Date(story.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              {isOwn ? (
                <>
                  {onAddStory ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-full text-white hover:bg-white/15"
                      onClick={onAddStory}
                      aria-label={t("stories.add")}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  ) : null}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-white hover:bg-white/15"
                    onClick={() => void loadViewers()}
                    aria-label={t("stories.viewersTitle")}
                  >
                    <Eye className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-white hover:bg-white/15"
                    onClick={() => void deleteStory()}
                    aria-label={t("stories.delete")}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-white hover:bg-white/15"
                onClick={handleClose}
                aria-label={t("stories.close")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Tap zones — left/right thirds */}
          <button
            type="button"
            aria-label={t("stories.prev")}
            className="absolute bottom-0 left-0 top-16 z-20 w-[32%]"
            onClick={goPrev}
          />
          <button
            type="button"
            aria-label={t("stories.next")}
            className="absolute bottom-0 right-0 top-16 z-20 w-[32%]"
            onClick={goNext}
          />

          {/* Desktop chevrons */}
          {groupIndex > 0 ? (
            <button
              type="button"
              className="absolute left-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur-sm transition hover:bg-black/60 md:block"
              onClick={() => {
                setGroupIndex((i) => i - 1)
                setStoryIndex(0)
                setProgress(0)
              }}
              aria-label={t("stories.prev")}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}
          {groupIndex < groups.length - 1 ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur-sm transition hover:bg-black/60 md:block"
              onClick={() => {
                setGroupIndex((i) => i + 1)
                setStoryIndex(0)
                setProgress(0)
              }}
              aria-label={t("stories.next")}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <Dialog open={viewersOpen} onOpenChange={setViewersOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("stories.viewersTitle")} ({viewerCount})
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {viewers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("stories.noViewers")}</p>
            ) : (
              viewers.map((v) => (
                <div key={v.user.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={v.user.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {v.user.name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{v.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.viewedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>,
    document.body
  )
}
