"use client"

import { useCallback, useEffect, useState } from "react"
import { Bookmark } from "lucide-react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import { useLocale } from "@/lib/i18n/locale-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Props = {
  postId: number
  size?: "sm" | "md"
  className?: string
  onAuthRequired?: () => void
}

export function SaveButton({
  postId,
  size = "sm",
  className,
  onAuthRequired,
}: Props) {
  const { t } = useLocale()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const statusPath = `/posts/id/${postId}/saved`
  const togglePath = `/posts/id/${postId}/save`

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setSaved(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const res = await authFetch(statusPath, { cache: "no-store" })
      if (!res.ok || cancelled) return
      const data = (await res.json()) as { saved?: boolean }
      if (!cancelled) setSaved(data.saved === true)
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
    setBusy(true)
    try {
      const res = await authFetch(togglePath, { method: "POST" })
      if (!res.ok) throw new Error("fail")
      const data = (await res.json()) as { saved?: boolean }
      setSaved(data.saved === true)
      toast.success(data.saved ? t("saved.savedToast") : t("saved.unsavedToast"))
    } catch {
      toast.error(t("saved.toggleFail"))
    } finally {
      setBusy(false)
    }
  }, [togglePath, onAuthRequired, t])

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"

  return (
    <Button
      type="button"
      variant={saved ? "default" : "outline"}
      size="sm"
      className={cn(
        "gap-1.5 rounded-full",
        size === "sm" ? "h-8 px-3" : "px-4",
        className
      )}
      disabled={busy}
      aria-label={saved ? t("saved.unsave") : t("saved.save")}
      title={saved ? t("saved.unsave") : t("saved.save")}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void toggle()
      }}
    >
      <Bookmark className={cn(iconSize, saved && "fill-current")} />
    </Button>
  )
}
