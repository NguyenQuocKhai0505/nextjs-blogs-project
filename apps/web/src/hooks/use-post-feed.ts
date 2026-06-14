"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { apiUrl } from "@/lib/api"
import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import type { FeedPost } from "@/lib/types"
import type { DayFilter, FeedMode } from "@/lib/types/feed"

export type { FeedMode }

type FeedResponse = {
  items?: FeedPost[]
  nextCursor?: number | null
}

const PAGE_SIZE = 10

function parseFeedPayload(data: unknown): { items: FeedPost[]; nextCursor: number | null } {
  if (Array.isArray(data)) {
    return { items: data as FeedPost[], nextCursor: null }
  }
  const row = data as FeedResponse
  const items = Array.isArray(row.items) ? row.items : []
  const next =
    typeof row.nextCursor === "number" && row.nextCursor > 0 ? row.nextCursor : null
  return { items, nextCursor: next }
}

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

/** For You: plain fetch (giống code cũ, tránh CORS preflight). Following: authFetch để gửi JWT. */
async function feedFetch(path: string, mode: FeedMode, init?: RequestInit) {
  if (mode === "following" && getAccessToken()) {
    return authFetch(path, init)
  }
  return fetch(apiUrl(path), init)
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
        if (!apiUrl("/").startsWith("http")) {
          throw new Error("NEXT_PUBLIC_API_URL is not configured")
        }

        const path = `/posts${buildQuery({ mode, categoryIds, days, cursor: cursor ?? undefined })}`
        const res = await feedFetch(path, mode, { cache: "no-store" })
        if (!res.ok) {
          const body = await res.text().catch(() => "")
          throw new Error(`Feed HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`)
        }
        const data: unknown = await res.json()
        if (requestId !== requestIdRef.current) return

        const { items, nextCursor: next } = parseFeedPayload(data)

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
