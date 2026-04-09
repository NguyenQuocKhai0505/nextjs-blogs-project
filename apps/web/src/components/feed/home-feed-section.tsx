"use client"

import Link from "next/link"
import { PenSquare } from "lucide-react"

import PostList from "@/components/post/post-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale } from "@/lib/i18n/locale-context"
import type { FeedPost } from "@/lib/types"

export default function HomeFeedSection({
  posts,
  viewerId,
  viewerRole,
}: {
  posts: FeedPost[]
  viewerId: string | null
  viewerRole: "USER" | "ADMIN" | null
}) {
  const { t } = useLocale()
  const hasPosts = posts.length > 0

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("home.feedTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("home.feedSubtitle")}</p>
        </div>
        <Button asChild size="sm" variant="outline" className="rounded-xl">
          <Link href="/post/create">
            <PenSquare className="mr-2 h-4 w-4" />
            {t("home.post")}
          </Link>
        </Button>
      </div>

      {hasPosts ? (
        <PostList posts={posts} viewerId={viewerId} viewerRole={viewerRole} />
      ) : (
        <Card className="rounded-2xl border-dashed bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40">
          <CardContent className="space-y-3 py-12 text-center">
            <p className="text-base font-semibold">{t("home.noPostsTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("home.noPostsHint")}</p>
            <Button asChild className="rounded-xl">
              <Link href="/post/create">{t("home.createFirstPost")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
