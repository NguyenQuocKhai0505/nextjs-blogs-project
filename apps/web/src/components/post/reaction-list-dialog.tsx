"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { authFetch } from "@/lib/auth-fetch"
import {
  REACTION_EMOJI,
  REACTION_LABEL,
  type ReactionType,
} from "@/lib/types/reactions"
import { useLocale } from "@/lib/i18n/locale-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type ReactionListItem = {
  userId: string
  reaction: ReactionType
  createdAt: string
  user: { id: string; name: string; avatarUrl: string | null }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId?: number
  reelId?: number
  storyId?: number
  filterReaction?: ReactionType | null
}

function listPath(
  postId?: number,
  reelId?: number,
  storyId?: number,
  reaction?: ReactionType | null
) {
  const base =
    storyId != null
      ? `/stories/${storyId}/reactions`
      : reelId != null
        ? `/reels/${reelId}/reactions`
        : `/posts/id/${postId}/reactions`
  if (reaction) return `${base}?reaction=${reaction}`
  return base
}

export function ReactionListDialog({
  open,
  onOpenChange,
  postId,
  reelId,
  storyId,
  filterReaction = null,
}: Props) {
  const { t } = useLocale()
  const [items, setItems] = useState<ReactionListItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!postId && !reelId && !storyId) return
    setLoading(true)
    try {
      const path = listPath(postId, reelId, storyId, filterReaction)
      const res = await authFetch(path, { cache: "no-store" })
      if (!res.ok) throw new Error("fail")
      const data = (await res.json()) as { items?: ReactionListItem[] }
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [postId, reelId, storyId, filterReaction])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const title = filterReaction
    ? `${REACTION_EMOJI[filterReaction]} ${REACTION_LABEL[filterReaction]}`
    : t("post.reactionsTitle")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(70vh,520px)] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[min(55vh,420px)] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("post.reactionsLoading")}
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("post.reactionsEmpty")}
            </p>
          ) : (
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={`${item.userId}-${item.reaction}`}>
                  <Link
                    href={`/profile/${item.user.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                    onClick={() => onOpenChange(false)}
                  >
                    <Avatar className="h-9 w-9">
                      {item.user.avatarUrl ? (
                        <AvatarImage src={item.user.avatarUrl} alt="" />
                      ) : null}
                      <AvatarFallback>
                        {item.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.user.name}</p>
                    </div>
                    <span className="text-lg" title={REACTION_LABEL[item.reaction]}>
                      {REACTION_EMOJI[item.reaction]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
