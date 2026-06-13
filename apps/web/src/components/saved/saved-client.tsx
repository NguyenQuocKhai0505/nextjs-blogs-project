"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bookmark, Loader2 } from "lucide-react"
import { toast } from "sonner"

import PostCard from "@/components/post/post-card"
import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import type { FeedPost } from "@/lib/types"
import { useLocale } from "@/lib/i18n/locale-context"
import { Button } from "@/components/ui/button"

type SavedItem = {
  savedAt: string
  post: FeedPost
}

export default function SavedClient({
  viewerId,
  viewerRole,
}: {
  viewerId: string | null
  viewerRole: "USER" | "ADMIN" | null
}) {
  const router = useRouter()
  const { t } = useLocale()
  const [items, setItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await authFetch("/saved", { cache: "no-store" })
        if (!res.ok) throw new Error("fail")
        const data = (await res.json()) as { items?: SavedItem[] }
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : [])
      } catch {
        if (!cancelled) toast.error(t("saved.loadFail"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  if (!getAccessToken()) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center">
        <Bookmark className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-semibold">{t("saved.loginTitle")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("saved.loginHint")}</p>
        <Button className="mt-4 rounded-xl" onClick={() => router.push("/auth")}>
          {t("header.login")}
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t("saved.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("saved.subtitle")}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 px-6 py-12 text-center">
          <p className="font-medium">{t("saved.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("saved.emptyHint")}</p>
          <Button asChild className="mt-4 rounded-xl" variant="outline">
            <Link href="/">{t("saved.browseFeed")}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(({ post }) => (
            <PostCard
              key={post.id}
              post={post}
              viewerId={viewerId}
              viewerRole={viewerRole}
            />
          ))}
        </div>
      )}
    </div>
  )
}
