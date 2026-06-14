"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import CategoriesBar from "@/components/feed/categories-bar"
import StoriesBar from "@/components/feed/stories-bar"
import ComposerCard from "@/components/feed/composer-card"
import HomeFeedSection from "@/components/feed/home-feed-section"
import type { DayFilter, FeedMode } from "@/lib/types/feed"
import { usePostFeed } from "@/hooks/use-post-feed"

export default function HomeClient({
  viewerId,
  viewerRole,
}: {
  viewerId: string | null
  viewerRole: "USER" | "ADMIN" | null
}) {
  const searchParams = useSearchParams()
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [days, setDays] = useState<DayFilter>(0)
  const [feedMode, setFeedMode] = useState<FeedMode>("forYou")

  useEffect(() => {
    const raw = searchParams.get("categoryIds")?.trim()
    if (!raw) return
    const ids = raw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
    if (ids.length) setSelectedCategoryIds(ids)
  }, [searchParams])

  const { posts, loading, loadingMore, error, hasMore, loadMore } = usePostFeed({
    mode: feedMode,
    categoryIds: selectedCategoryIds,
    days,
  })

  return (
    <div className="space-y-4">
      <StoriesBar viewerId={viewerId} />
      <CategoriesBar
        viewerRole={viewerRole}
        selectedCategoryIds={selectedCategoryIds}
        onSelectedCategoryIdsChange={setSelectedCategoryIds}
      />
      <ComposerCard />
      <HomeFeedSection
        posts={posts}
        viewerId={viewerId}
        viewerRole={viewerRole}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        feedMode={feedMode}
        onFeedModeChange={setFeedMode}
        days={days}
        onDaysChange={setDays}
      />
    </div>
  )
}
