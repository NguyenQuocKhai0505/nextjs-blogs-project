"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Heart, MessageCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { confirmToast } from "@/lib/confirm-toast"
import Lightbox from "@/components/media/lightbox"

import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import CommentThread from "@/components/post/comment-thread"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type PostDetailPayload = {
  id: number
  title: string
  description: string
  content: string
  slug: string
  imageUrls: string | null
  videoUrls: string | null
  categoryId: number | null
  category: { id: number; name: string; slug: string } | null
  likeCount: number
  commentCount: number
  authorId: string
  createdAt: string
  author: { id: string; name: string; avatarUrl: string | null }
}

function parseMedia(media?: string | null): string[] {
  if (!media) return []
  try {
    const p = JSON.parse(media) as unknown
    return Array.isArray(p) ? p.filter((u): u is string => typeof u === "string") : []
  } catch {
    return []
  }
}

export default function PostDetailClient({
  post,
  canEdit,
  viewerId,
}: {
  post: PostDetailPayload
  canEdit: boolean
  viewerId: string | null
}) {
  const router = useRouter()
  const images = parseMedia(post.imageUrls)
  const videos = parseMedia(post.videoUrls)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [liked, setLiked] = useState(false)
  const [commentTotal, setCommentTotal] = useState(post.commentCount)
  const [likeBusy, setLikeBusy] = useState(false)

  useEffect(() => {
    setCommentTotal(post.commentCount)
  }, [post.id, post.commentCount])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setLiked(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const res = await authFetch(`/posts/id/${post.id}/liked`, { cache: "no-store" })
      if (!res.ok || cancelled) return
      const data = (await res.json()) as { liked?: boolean; likeCount?: number }
      if (typeof data.liked === "boolean") setLiked(data.liked)
      if (typeof data.likeCount === "number") setLikeCount(data.likeCount)
    })()
    return () => {
      cancelled = true
    }
  }, [post.id])

  const requireAuth = () => {
    if (!getAccessToken()) {
      toast.error("Please sign in to continue.")
      router.push("/auth")
      return false
    }
    return true
  }

  const onToggleLike = async () => {
    if (!requireAuth()) return
    setLikeBusy(true)
    try {
      const res = await authFetch(`/posts/id/${post.id}/like`, { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      const data = (await res.json()) as { liked: boolean; likeCount: number }
      setLiked(data.liked)
      setLikeCount(data.likeCount)
    } catch {
      toast.error("Could not update reaction.")
    } finally {
      setLikeBusy(false)
    }
  }

  const onDeletePost = async () => {
    const ok = await confirmToast({
      title: "Delete this post permanently?",
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (!ok) return
    const res = await authFetch(`/posts/${post.id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error("Could not delete post.")
      return
    }
    toast.success("Post deleted")
    router.push("/")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Lightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={images}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <Link
            href={`/profile/${post.author.id}`}
            className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border"
          >
            {post.author.avatarUrl ? (
              <Image src={post.author.avatarUrl} alt="" fill className="object-cover" sizes="44px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                {post.author.name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
            )}
          </Link>
          <div className="min-w-0">
            <Link href={`/profile/${post.author.id}`} className="font-semibold hover:underline">
              {post.author.name}
            </Link>
            <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        {canEdit ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0" aria-label="Post options">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href={`/post/edit/${post.slug}`} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit post
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={() => void onDeletePost()}
              >
                <Trash2 className="h-4 w-4" />
                Delete post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        {post.category ? (
          <p className="mt-2">
            <span className="inline-flex rounded-full border bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {post.category.name}
            </span>
          </p>
        ) : null}
        {post.description ? (
          <p className="mt-2 text-muted-foreground">{post.description}</p>
        ) : null}
      </div>

      {images.length > 0 ? (
        <div
          className={
            images.length === 1
              ? "mx-auto w-full max-w-3xl rounded-xl border border-border/70 bg-muted/40 p-2.5 shadow-sm ring-1 ring-border/30"
              : "grid gap-3 sm:grid-cols-2"
          }
        >
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              className={
                images.length === 1
                  ? "group relative aspect-video w-full overflow-hidden rounded-lg bg-background/70 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  : "group relative aspect-video overflow-hidden rounded-xl border border-border/60 bg-muted/25 text-left shadow-sm ring-1 ring-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              }
              onClick={() => {
                setLightboxIndex(i)
                setLightboxOpen(true)
              }}
              aria-label="Open image"
            >
              <Image
                src={src}
                alt=""
                fill
                className={
                  images.length === 1
                    ? "object-contain object-center transition-transform duration-300 group-hover:scale-[1.01]"
                    : "object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                }
                sizes={images.length === 1 ? "(max-width: 768px) 92vw, 768px" : "(max-width: 768px) 100vw, 50vw"}
              />
              <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </button>
          ))}
        </div>
      ) : null}

      {videos.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Video</h2>
          <div className="space-y-4">
            {videos.map((src, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border bg-black shadow-sm ring-1 ring-border/40"
              >
                <video src={src} controls className="aspect-video w-full max-h-[70vh] object-contain" playsInline />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="whitespace-pre-wrap rounded-2xl border bg-card p-4 text-[15px] leading-relaxed">
        {post.content}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-y border-border/60 py-4">
        <Button
          type="button"
          variant={liked ? "default" : "outline"}
          size="sm"
          className="rounded-full gap-2"
          disabled={likeBusy}
          onClick={() => void onToggleLike()}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {likeCount} {likeCount === 1 ? "reaction" : "reactions"}
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          {commentTotal} {commentTotal === 1 ? "comment" : "comments"}
        </div>
      </div>

      <CommentThread
        postId={post.id}
        viewerId={viewerId}
        isPostAuthor={canEdit}
        anchorId="comments"
        onTotalChange={setCommentTotal}
      />
    </div>
  )
}
