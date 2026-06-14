"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Eye, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import type { StoryGroup, StoryItem } from "@/lib/types/stories"
import { useLocale } from "@/lib/i18n/locale-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ReactionPicker } from "@/components/post/reaction-picker"
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

  const requireAuth = useCallback(() => {
    if (!getAccessToken()) {
      toast.error(t("post.signInToast"))
      handleClose()
      return false
    }
    return true
  }, [t, handleClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [handleClose])

  if (!group || !story) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <button
          type="button"
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
          aria-label={t("stories.close")}
        />

        <div className="relative z-10 h-full w-full max-w-lg overflow-hidden bg-black shadow-2xl md:h-[min(96dvh,900px)] md:rounded-2xl">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 z-50 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
            onClick={handleClose}
            aria-label={t("stories.close")}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Progress bars */}
          <div className="absolute left-0 right-0 top-0 z-40 flex gap-1 px-3 pt-3">
            {group.stories.map((s, i) => (
              <div
                key={s.id}
                className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
              >
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
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
          <div className="absolute left-0 right-12 top-6 z-40 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9 border border-white/20">
                <AvatarImage src={group.user.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {group.user.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-white">{group.user.name}</p>
                <p className="text-xs text-white/70">
                  {new Date(story.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            {isOwn ? (
              <div className="flex items-center gap-1">
                {onAddStory && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                    onClick={onAddStory}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => void loadViewers()}
                >
                  <Eye className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => void deleteStory()}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ) : null}
          </div>

          {/* Story content */}
          <div className="relative z-0 flex h-full items-center justify-center pt-14 pb-24">
            {story.mediaType === "IMAGE" && story.imageUrl && (
              <div className="relative h-full w-full">
                <Image
                  src={story.imageUrl}
                  alt=""
                  fill
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
            )}
            {story.mediaType === "VIDEO" && story.videoUrl && (
              <video
                ref={videoRef}
                src={story.videoUrl}
                className="max-h-full max-w-full"
                autoPlay
                playsInline
                controls
                onEnded={goNext}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget
                  if (v.duration) {
                    setProgress((v.currentTime / v.duration) * 100)
                  }
                }}
              />
            )}
            {story.mediaType === "TEXT" && (
              <div
                className="flex h-full w-full items-center justify-center p-8"
                style={{ backgroundColor: story.backgroundColor ?? "#3b82f6" }}
              >
                <p className="max-w-sm text-center text-2xl font-semibold leading-snug text-white">
                  {story.textContent}
                </p>
              </div>
            )}
          </div>

          {/* Reactions */}
          {!isOwn ? (
            <div className="absolute bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-6 pt-2">
              <div className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 backdrop-blur-md">
                <ReactionPicker
                  storyId={story.id}
                  initialCount={story.reactionCount ?? 0}
                  size="md"
                  className="[&_button]:border-white/30 [&_button]:bg-white/10 [&_button]:text-white"
                  onAuthRequired={requireAuth}
                />
              </div>
            </div>
          ) : null}

          {/* Tap zones */}
          <button
            type="button"
            aria-label={t("stories.prev")}
            className="absolute bottom-24 left-0 top-20 z-20 w-1/3"
            onClick={goPrev}
          />
          <button
            type="button"
            aria-label={t("stories.next")}
            className="absolute bottom-24 right-0 top-20 z-20 w-1/3"
            onClick={goNext}
          />

          {groupIndex > 0 && (
            <button
              type="button"
              className="absolute left-1 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white"
              onClick={() => {
                setGroupIndex((i) => i - 1)
                setStoryIndex(0)
                setProgress(0)
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {groupIndex < groups.length - 1 && (
            <button
              type="button"
              className="absolute right-1 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white"
              onClick={() => {
                setGroupIndex((i) => i + 1)
                setStoryIndex(0)
                setProgress(0)
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
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
    </>
  )
}
