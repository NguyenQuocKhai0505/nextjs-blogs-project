"use client"

import Link from "next/link"
import { PenSquare } from "lucide-react"

import PostList from "@/components/post/post-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale } from "@/lib/i18n/locale-context"
import type { FeedPost } from "@/lib/types"
import type { DayFilter } from "@/components/feed/home-client"

export default function HomeFeedSection({
  posts,
  viewerId,
  viewerRole,
  loading = false,
  days,
  onDaysChange,
  theme,
}: {
  posts: FeedPost[]
  viewerId: string | null
  viewerRole: "USER" | "ADMIN" | null
  loading?: boolean
  days: DayFilter
  onDaysChange: (next: DayFilter) => void
  theme: "light" | "dark"
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
        <div className="flex items-center gap-2">
          <select
            value={String(days)}
            onChange={(e) => onDaysChange((Number(e.target.value) as DayFilter) || 0)}
            style={{ colorScheme: theme }}
            className="h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground"
            aria-label="Filter by days"
            disabled={loading}
          >
            <option value="0">All time</option>
            <option value="1">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href="/post/create">
              <PenSquare className="mr-2 h-4 w-4" />
              {t("home.post")}
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="rounded-2xl bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading…</CardContent>
        </Card>
      ) : hasPosts ? (
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
