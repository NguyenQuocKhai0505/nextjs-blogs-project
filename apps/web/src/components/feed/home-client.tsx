"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

import CategoriesBar from "@/components/feed/categories-bar"
import StoriesBar from "@/components/feed/stories-bar"
import ComposerCard from "@/components/feed/composer-card"
import HomeFeedSection from "@/components/feed/home-feed-section"
import type { FeedPost } from "@/lib/types"
import { apiUrl } from "@/lib/api"
import { useTheme } from "next-themes"

export type DayFilter = 0 | 1 | 7 | 30

export default function HomeClient({
  viewerId,
  viewerRole,
}: {
  viewerId: string | null
  viewerRole: "USER" | "ADMIN" | null
}) {
  const { resolvedTheme } = useTheme()
  const searchParams = useSearchParams()
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [days, setDays] = useState<DayFilter>(0)

  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = searchParams.get("categoryIds")?.trim()
    if (!raw) return
    const ids = raw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
    if (ids.length) setSelectedCategoryIds(ids)
  }, [searchParams])

  const query = useMemo(() => {
    const qs = new URLSearchParams()
    if (selectedCategoryIds.length) qs.set("categoryIds", selectedCategoryIds.join(","))
    if (days) qs.set("days", String(days))
    const s = qs.toString()
    return s ? `?${s}` : ""
  }, [selectedCategoryIds, days])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetch(apiUrl(`/posts${query}`), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (cancelled) return
        setPosts(Array.isArray(data) ? (data as FeedPost[]) : [])
      })
      .catch(() => {
        if (!cancelled) setPosts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query])

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
        days={days}
        onDaysChange={setDays}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </div>
  )
}

