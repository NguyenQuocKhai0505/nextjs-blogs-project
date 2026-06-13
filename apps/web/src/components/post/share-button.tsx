"use client"

import { useCallback, useEffect, useState } from "react"
import { Share2 } from "lucide-react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import { useLocale } from "@/lib/i18n/locale-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Props = {
  postId: number
  initialShareCount?: number
  isAuthor?: boolean
  size?: "sm" | "md"
  className?: string
  onAuthRequired?: () => void
}

export function ShareButton({
  postId,
  initialShareCount = 0,
  isAuthor = false,
  size = "sm",
  className,
  onAuthRequired,
}: Props) {
  const { t } = useLocale()
  const [shared, setShared] = useState(false)
  const [shareCount, setShareCount] = useState(initialShareCount)
  const [busy, setBusy] = useState(false)

  const statusPath = `/posts/id/${postId}/shared`
  const togglePath = `/posts/id/${postId}/share`

  useEffect(() => {
    setShareCount(initialShareCount)
  }, [initialShareCount, postId])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setShared(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const res = await authFetch(statusPath, { cache: "no-store" })
      if (!res.ok || cancelled) return
      const data = (await res.json()) as { shared?: boolean; shareCount?: number }
      if (!cancelled) {
        setShared(data.shared === true)
        if (typeof data.shareCount === "number") setShareCount(data.shareCount)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [statusPath, postId])

  const toggle = useCallback(async () => {
    if (!getAccessToken()) {
      onAuthRequired?.()
      return
    }
    if (isAuthor) {
      toast.error(t("share.ownPost"))
      return
    }
    setBusy(true)
    try {
      const res = await authFetch(togglePath, { method: "POST" })
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null
        throw new Error(err?.message ?? "fail")
      }
      const data = (await res.json()) as { shared?: boolean; shareCount?: number }
      setShared(data.shared === true)
      if (typeof data.shareCount === "number") setShareCount(data.shareCount)
      toast.success(data.shared ? t("share.sharedToast") : t("share.unsharedToast"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("share.toggleFail"))
    } finally {
      setBusy(false)
    }
  }, [togglePath, onAuthRequired, isAuthor, t])

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"

  return (
    <Button
      type="button"
      variant={shared ? "default" : "outline"}
      size="sm"
      className={cn(
        "gap-1.5 rounded-full",
        size === "sm" ? "h-8 px-3" : "px-4",
        className
      )}
      disabled={busy || isAuthor}
      aria-label={shared ? t("share.unshare") : t("share.share")}
      title={isAuthor ? t("share.ownPost") : shared ? t("share.unshare") : t("share.share")}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void toggle()
      }}
    >
      <Share2 className={iconSize} />
      {shareCount > 0 ? (
        <span className="text-xs font-medium tabular-nums">{shareCount}</span>
      ) : null}
    </Button>
  )
}
