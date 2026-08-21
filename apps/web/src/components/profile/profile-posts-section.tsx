"use client"

import Link from "next/link"
import Image from "next/image"
import { LayoutGrid, List } from "lucide-react"
import { useState } from "react"

import PostList from "@/components/post/post-list"
import type { FeedPost } from "@/lib/types"
import { cn } from "@/lib/utils"

function parseMedia(media?: string | string[] | null): string[] {
  if (!media) return []
  if (Array.isArray(media)) return media.filter(Boolean)
  try {
    const parsed = JSON.parse(media) as unknown
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === "string") : []
  } catch {
    return []
  }
}

export function ProfilePostsSection({
  posts,
  viewerId,
  viewerRole,
  emptyLabel,
}: {
  posts: FeedPost[]
  viewerId: string | null
  viewerRole: "USER" | "ADMIN" | null
  emptyLabel: string
}) {
  const [mode, setMode] = useState<"grid" | "list">("grid")

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-1 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setMode("grid")}
          className={cn(
            "rounded-lg p-2 transition-colors",
            mode === "grid" ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted"
          )}
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setMode("list")}
          className={cn(
            "rounded-lg p-2 transition-colors",
            mode === "list" ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted"
          )}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </button>
      </div>

      {mode === "grid" ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          {posts.map((p) => {
            const images = parseMedia(p.imageUrls)
            const videos = parseMedia(p.videoUrls)
            const thumb = images[0] ?? null
            return (
              <Link
                key={p.id}
                href={`/post/${p.slug}`}
                className="relative aspect-square overflow-hidden bg-muted"
              >
                {thumb ? (
                  <Image src={thumb} alt="" fill className="object-cover" sizes="200px" />
                ) : videos[0] ? (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-white/70">
                    Video
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted p-2 text-center text-[10px] text-muted-foreground line-clamp-4">
                    {p.title || p.description || "Post"}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <PostList posts={posts} viewerId={viewerId} viewerRole={viewerRole} />
        </div>
      )}
    </div>
  )
}
