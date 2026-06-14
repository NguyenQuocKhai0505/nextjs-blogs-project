"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { authFetch } from "@/lib/auth-fetch"
import type { FeedPost } from "@/lib/types"
import type { DayFilter, FeedMode } from "@/lib/types/feed"

export type { FeedMode }

type FeedResponse = {
  items?: FeedPost[]
  nextCursor?: number | null
}

const PAGE_SIZE = 10

function buildQuery(opts: {
  mode: FeedMode
  categoryIds: number[]
  days: DayFilter
  cursor?: number | null
}) {
  const qs = new URLSearchParams()
  qs.set("mode", opts.mode)
  qs.set("take", String(PAGE_SIZE))
  if (opts.categoryIds.length) qs.set("categoryIds", opts.categoryIds.join(","))
  if (opts.days) qs.set("days", String(opts.days))
  if (opts.cursor) qs.set("cursor", String(opts.cursor))
  return `?${qs.toString()}`
}

export function usePostFeed(opts: {
  mode: FeedMode
  categoryIds: number[]
  days: DayFilter
}) {
  const { mode, categoryIds, days } = opts
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const fetchPage = useCallback(
    async (cursor: number | null, append: boolean) => {
      const requestId = ++requestIdRef.current
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError(null)

      try {
        const res = await authFetch(
          `/posts${buildQuery({ mode, categoryIds, days, cursor: cursor ?? undefined })}`,
          { cache: "no-store" }
        )
        if (!res.ok) throw new Error("Failed to load feed")
        const data = (await res.json()) as FeedResponse
        if (requestId !== requestIdRef.current) return

        const items = Array.isArray(data.items) ? data.items : []
        const next =
          typeof data.nextCursor === "number" && data.nextCursor > 0
            ? data.nextCursor
            : null

        setPosts((prev) => {
          if (!append) return items
          const seen = new Set(prev.map((p) => p.id))
          const merged = [...prev]
          for (const item of items) {
            if (!seen.has(item.id)) merged.push(item)
          }
          return merged
        })
        setNextCursor(next)
      } catch (e) {
        if (requestId !== requestIdRef.current) return
        setError(e instanceof Error ? e.message : "Failed to load feed")
        if (!append) setPosts([])
        setNextCursor(null)
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [mode, categoryIds, days]
  )

  useEffect(() => {
    void fetchPage(null, false)
  }, [fetchPage])

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !nextCursor) return
    void fetchPage(nextCursor, true)
  }, [loading, loadingMore, nextCursor, fetchPage])

  const refresh = useCallback(() => {
    void fetchPage(null, false)
  }, [fetchPage])

  return {
    posts,
    loading,
    loadingMore,
    error,
    hasMore: nextCursor != null,
    loadMore,
    refresh,
  }
}
