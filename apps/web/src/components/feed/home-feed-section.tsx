"use client"

import Link from "next/link"
import { Loader2, Users } from "lucide-react"

import PostList from "@/components/post/post-list"
import { FeedTabs } from "@/components/feed/feed-tabs"
import { FeedSkeletonList } from "@/components/feed/feed-skeleton"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/i18n/locale-context"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import type { FeedMode } from "@/lib/types/feed"
import type { FeedPost } from "@/lib/types"
import type { DayFilter } from "@/lib/types/feed"
import { cn } from "@/lib/utils"

const DAY_OPTIONS: { value: DayFilter; labelKey: string }[] = [
  { value: 0, labelKey: "home.daysAll" },
  { value: 1, labelKey: "home.daysToday" },
  { value: 7, labelKey: "home.daysWeek" },
  { value: 30, labelKey: "home.daysMonth" },
]

export default function HomeFeedSection({
  posts,
  viewerId,
  viewerRole,
  loading = false,
  loadingMore = false,
  error = null,
  hasMore = false,
  onLoadMore,
  feedMode,
  onFeedModeChange,
  days,
  onDaysChange,
}: {
  posts: FeedPost[]
  viewerId: string | null
  viewerRole: "USER" | "ADMIN" | null
  loading?: boolean
  loadingMore?: boolean
  error?: string | null
  hasMore?: boolean
  onLoadMore: () => void
  feedMode: FeedMode
  onFeedModeChange: (mode: FeedMode) => void
  days: DayFilter
  onDaysChange: (next: DayFilter) => void
}) {
  const { t } = useLocale()
  const hasPosts = posts.length > 0
  const sentinelRef = useInfiniteScroll({
    enabled: hasMore && !loading && !loadingMore,
    onLoadMore,
  })

  const emptyFollowing = feedMode === "following" && !loading && !hasPosts

  return (
    <section className="space-y-3">
      <div className="sticky top-14 z-20 -mx-3 border-y border-border bg-background/95 px-3 backdrop-blur-md sm:-mx-0 sm:rounded-none sm:border-x-0">
        <FeedTabs mode={feedMode} onModeChange={onFeedModeChange} disabled={loading} />
        <div className="flex flex-wrap gap-1.5 py-2.5">
          {DAY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={loading}
              onClick={() => onDaysChange(opt.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors sm:text-xs",
                days === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                loading && "opacity-60"
              )}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 py-8 text-center text-sm text-destructive">
          <p>{t("home.feedError")}</p>
          {process.env.NODE_ENV !== "production" && error ? (
            <p className="mt-2 text-xs text-destructive/80">{error}</p>
          ) : null}
        </div>
      ) : loading ? (
        <FeedSkeletonList count={3} />
      ) : hasPosts ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card sm:rounded-2xl">
            <PostList posts={posts} viewerId={viewerId} viewerRole={viewerRole} />
          </div>
          <div ref={sentinelRef} className="h-1" aria-hidden />
          {loadingMore ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("home.loadingMore")}
            </div>
          ) : null}
          {!hasMore && posts.length > 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">{t("home.feedEnd")}</p>
          ) : null}
        </>
      ) : emptyFollowing ? (
        <div className="space-y-4 rounded-2xl border border-dashed border-border py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold">{t("home.noFollowingTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {!viewerId ? t("home.noFollowingSignIn") : t("home.noFollowingHint")}
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href={viewerId ? "/discover" : "/auth"}>
              {viewerId ? t("home.discoverPeople") : t("home.signIn")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-dashed border-border py-12 text-center">
          <p className="text-base font-semibold">{t("home.noPostsTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("home.noPostsHint")}</p>
          <Button asChild className="rounded-full">
            <Link href="/post/create">{t("home.createFirstPost")}</Link>
          </Button>
        </div>
      )}
    </section>
  )
}
