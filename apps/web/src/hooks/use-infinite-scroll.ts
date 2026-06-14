"use client"

import { useEffect, useRef } from "react"

type Options = {
  enabled?: boolean
  rootMargin?: string
  onLoadMore: () => void
}

export function useInfiniteScroll({
  enabled = true,
  rootMargin = "200px",
  onLoadMore,
}: Options) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    if (!enabled) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current()
        }
      },
      { rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return sentinelRef
}
