"use client"

import { useEffect, useState } from "react"
import type { PostCardProps } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Heart, MessageCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import { toast } from "sonner"
import CommentThreadDialog from "./comment-thread-dialog"

function parseMediaField(media?: string | string[] | null): string[] {
  if (!media) return []
  if (Array.isArray(media)) return media.filter(Boolean)
  try {
    const parsed = JSON.parse(media) as unknown
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === "string") : []
  } catch {
    return []
  }
}

function PostMediaGrid({
  imageUrls,
  postSlug,
}: {
  imageUrls: string[]
  postSlug: string
}) {
  const href = `/post/${postSlug}`
  const n = imageUrls.length
  if (n === 0) return null

  const cellClass =
    "relative block min-h-0 min-w-0 overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  const Img = ({
    src,
    alt,
    className,
    sizes,
    priority,
  }: {
    src: string
    alt: string
    className?: string
    sizes: string
    priority?: boolean
  }) => (
    <Image
      src={src}
      alt={alt}
      fill
      className={className ?? "object-cover"}
      sizes={sizes}
      priority={priority}
    />
  )

  if (n === 1) {
    return (
      <Link href={href} className={`${cellClass} aspect-[16/9] w-full`}>
        <Img src={imageUrls[0]} alt="" sizes="(max-width: 768px) 100vw, 640px" priority />
      </Link>
    )
  }

  if (n === 2) {
    return (
      <div className="grid h-[220px] grid-cols-2 gap-0.5 bg-border">
        {imageUrls.slice(0, 2).map((src, i) => (
          <Link key={i} href={href} className={cellClass}>
            <Img src={src} alt="" sizes="(max-width: 768px) 50vw, 320px" priority={i === 0} />
          </Link>
        ))}
      </div>
    )
  }

  if (n === 3) {
    return (
      <div className="grid h-[280px] grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-0.5 bg-border">
        <Link href={href} className={`${cellClass} row-span-2`}>
          <Img src={imageUrls[0]} alt="" sizes="(max-width: 768px) 60vw, 400px" priority />
        </Link>
        <Link href={href} className={cellClass}>
          <Img src={imageUrls[1]} alt="" sizes="(max-width: 768px) 40vw, 260px" />
        </Link>
        <Link href={href} className={cellClass}>
          <Img src={imageUrls[2]} alt="" sizes="(max-width: 768px) 40vw, 260px" />
        </Link>
      </div>
    )
  }

  if (n === 4) {
    return (
      <div className="grid h-[300px] grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] grid-rows-2 gap-0.5 bg-border">
        <Link href={href} className={cellClass}>
          <Img src={imageUrls[0]} alt="" sizes="(max-width: 768px) 55vw, 360px" priority />
        </Link>
        <Link href={href} className={cellClass}>
          <Img src={imageUrls[1]} alt="" sizes="(max-width: 768px) 45vw, 280px" />
        </Link>
        <Link href={href} className={cellClass}>
          <Img src={imageUrls[2]} alt="" sizes="(max-width: 768px) 55vw, 360px" />
        </Link>
        <Link href={href} className={cellClass}>
          <Img src={imageUrls[3]} alt="" sizes="(max-width: 768px) 45vw, 280px" />
        </Link>
      </div>
    )
  }

  const left = [imageUrls[0], imageUrls[1]]
  const right = [imageUrls[2], imageUrls[3], imageUrls[4]]
  const extra = n > 5 ? n - 5 : 0

  return (
    <div className="flex h-[320px] gap-0.5 bg-border">
      <div className="flex min-w-0 flex-[1.55] flex-col gap-0.5">
        {left.map((src, i) => (
          <Link key={i} href={href} className={`${cellClass} min-h-0 flex-1`}>
            <Img src={src} alt="" sizes="(max-width: 768px) 58vw, 420px" priority={i === 0} />
          </Link>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {right.map((src, i) => {
          const isLast = i === 2
          return (
            <Link key={i} href={href} className={`${cellClass} relative min-h-0 flex-1`}>
              <Img src={src} alt="" sizes="(max-width: 768px) 42vw, 300px" />
              {isLast && extra > 0 ? (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-semibold text-white">
                  +{extra}
                </span>
              ) : null}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function PostCard({ post, viewerId = null }: PostCardProps) {
  const router = useRouter()
  const authorId = post.authorId ?? post.author.id
  const isAuthor = Boolean(viewerId && authorId && viewerId === authorId)

  const images = parseMediaField(post.imageUrls)
  const videos = parseMediaField(post.videoUrls)
  const hasMedia = images.length > 0 || videos.length > 0

  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0)
  const [liked, setLiked] = useState(false)
  const [likeBusy, setLikeBusy] = useState(false)

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0)

  useEffect(() => {
    setLikeCount(post.likeCount ?? 0)
  }, [post.id, post.likeCount])

  useEffect(() => {
    setCommentCount(post.commentCount ?? 0)
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

  const onToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!requireAuth()) return
    setLikeBusy(true)
    try {
      const res = await authFetch(`/posts/id/${post.id}/like`, { method: "POST" })
      if (!res.ok) throw new Error("fail")
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
    if (!confirm("Delete this post permanently?")) return
    const res = await authFetch(`/posts/${post.id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error("Could not delete post.")
      return
    }
    toast.success("Post deleted")
    router.refresh()
  }

  return (
    <>
    <Card className="overflow-hidden rounded-2xl border bg-card/50 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-start gap-3">
          <Link
            href={`/profile/${post.author.id}`}
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border"
          >
            {post.author.avatarUrl ? (
              <Image
                src={post.author.avatarUrl}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                {post.author.name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/profile/${post.author.id}`}
                  className="text-sm font-semibold leading-5 hover:underline"
                >
                  {post.author.name}
                </Link>
                <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
              </div>
              {isAuthor ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground"
                      aria-label="Post options"
                    >
                      <MoreHorizontal className="size-4" />
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
            <Link href={`/post/${post.slug}`} className="group mt-2 block">
              <CardTitle className="line-clamp-2 text-lg font-bold leading-snug transition-colors group-hover:text-primary sm:text-xl">
                {post.title}
              </CardTitle>
            </Link>
            {post.description ? (
              <CardDescription className="mt-1 line-clamp-3 text-sm leading-relaxed">
                {post.description}
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>

      {hasMedia ? (
        <div className="border-t border-border/60">
          {images.length > 0 ? (
            <PostMediaGrid imageUrls={images} postSlug={post.slug} />
          ) : videos[0] ? (
            <div className="space-y-2 p-3 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Video</p>
              <div className="overflow-hidden rounded-2xl border bg-black ring-1 ring-border/40">
                <video
                  src={videos[0]}
                  className="aspect-video w-full max-h-[min(420px,70vh)] object-contain"
                  controls
                  muted
                  playsInline
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <CardContent className="space-y-3 pt-3 pb-4">
        <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
          <Button
            type="button"
            variant={liked ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 rounded-full px-3"
            disabled={likeBusy}
            onClick={(e) => void onToggleLike(e)}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">{likeCount}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-full px-2 text-muted-foreground"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setCommentsOpen(true)
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{commentCount}</span>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href={`/post/${post.slug}`} className="font-medium text-primary hover:underline">
            View details
          </Link>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">Community post</span>
        </div>
      </CardContent>
    </Card>
    <CommentThreadDialog
      open={commentsOpen}
      onOpenChange={setCommentsOpen}
      postId={post.id}
      postTitle={post.title}
      viewerId={viewerId ?? null}
      isPostAuthor={isAuthor}
      onCommentCountChange={setCommentCount}
    />
    </>
  )
}

export default PostCard
