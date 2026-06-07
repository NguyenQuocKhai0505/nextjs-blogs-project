"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ThumbsUp } from "lucide-react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import {
  REACTION_EMOJI,
  REACTION_LABEL,
  REACTION_TYPES,
  type ReactionStatus,
  type ReactionSummary,
  type ReactionType,
} from "@/lib/types/reactions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Props = {
  postId: number
  initialCount?: number
  size?: "sm" | "md"
  className?: string
  onAuthRequired?: () => void
}

function parseStatus(data: unknown, fallbackCount: number): ReactionStatus {
  const row = data as Record<string, unknown>
  const summary =
    row.summary && typeof row.summary === "object"
      ? (row.summary as ReactionSummary)
      : {}
  const reactionCount =
    typeof row.reactionCount === "number"
      ? row.reactionCount
      : typeof row.likeCount === "number"
        ? row.likeCount
        : fallbackCount
  const reaction =
    typeof row.reaction === "string" &&
    REACTION_TYPES.includes(row.reaction as ReactionType)
      ? (row.reaction as ReactionType)
      : row.liked === true
        ? "LIKE"
        : null
  return { reaction, reactionCount, summary }
}

function SummaryLine({ summary }: { summary: ReactionSummary }) {
  const items = REACTION_TYPES.filter((t) => (summary[t] ?? 0) > 0)
  if (!items.length) return null
  return (
    <span className="hidden text-xs text-muted-foreground sm:inline">
      {items.map((t) => (
        <span key={t} className="mr-1.5">
          {REACTION_EMOJI[t]} {summary[t]}
        </span>
      ))}
    </span>
  )
}

export function ReactionPicker({
  postId,
  initialCount = 0,
  size = "sm",
  className,
  onAuthRequired,
}: Props) {
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null)
  const [reactionCount, setReactionCount] = useState(initialCount)
  const [summary, setSummary] = useState<ReactionSummary>({})
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setReactionCount(initialCount)
  }, [postId, initialCount])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setMyReaction(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const res = await authFetch(`/posts/id/${postId}/reaction`, { cache: "no-store" })
      if (!res.ok || cancelled) return
      const data = parseStatus(await res.json(), initialCount)
      if (cancelled) return
      setMyReaction(data.reaction)
      setReactionCount(data.reactionCount)
      setSummary(data.summary)
    })()
    return () => {
      cancelled = true
    }
  }, [postId, initialCount])

  useEffect(() => {
    if (!pickerOpen) return
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [pickerOpen])

  const pick = useCallback(
    async (type: ReactionType) => {
      if (!getAccessToken()) {
        onAuthRequired?.()
        return
      }
      setBusy(true)
      setPickerOpen(false)
      try {
        const res = await authFetch(`/posts/id/${postId}/reaction`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reaction: type }),
        })
        if (!res.ok) throw new Error("fail")
        const data = parseStatus(await res.json(), reactionCount)
        setMyReaction(data.reaction)
        setReactionCount(data.reactionCount)
        setSummary(data.summary)
      } catch {
        toast.error("Could not update reaction.")
      } finally {
        setBusy(false)
      }
    },
    [postId, reactionCount, onAuthRequired]
  )

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  const activeEmoji = myReaction ? REACTION_EMOJI[myReaction] : null

  return (
    <div
      ref={wrapRef}
      className={cn("relative inline-flex items-center gap-2", className)}
      onMouseEnter={() => setPickerOpen(true)}
      onMouseLeave={() => setPickerOpen(false)}
    >
      {pickerOpen && (
        <div
          className="absolute bottom-full left-0 z-20 mb-2 flex gap-1 rounded-full border bg-card px-2 py-1.5 shadow-lg"
          role="toolbar"
          aria-label="Choose reaction"
        >
          {REACTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              title={REACTION_LABEL[type]}
              disabled={busy}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full text-xl transition-transform hover:scale-110 hover:bg-muted",
                myReaction === type && "bg-primary/15 ring-2 ring-primary/40"
              )}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void pick(type)
              }}
            >
              {REACTION_EMOJI[type]}
            </button>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant={myReaction ? "default" : "outline"}
        size="sm"
        className={cn(
          "gap-1.5 rounded-full",
          size === "sm" ? "h-8 px-3" : "px-4"
        )}
        disabled={busy}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void pick(myReaction ?? "LIKE")
        }}
      >
        {activeEmoji ? (
          <span className="text-base leading-none" aria-hidden>
            {activeEmoji}
          </span>
        ) : (
          <ThumbsUp className={iconSize} />
        )}
        <span className="text-xs font-medium">{reactionCount}</span>
      </Button>

      <SummaryLine summary={summary} />
    </div>
  )
}
