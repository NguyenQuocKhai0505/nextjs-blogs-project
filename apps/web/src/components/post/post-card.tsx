"use client"

import { useEffect, useState } from "react"
import type { PostCardProps } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { MessageCircle, MoreHorizontal, Pencil, Trash2, Flag } from "lucide-react"
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
import { useLocale } from "@/lib/i18n/locale-context"
import { confirmToast } from "@/lib/confirm-toast"
import Lightbox from "@/components/media/lightbox"
import { PostVideo } from "@/components/media/post-video"
import { ReactionPicker } from "@/components/post/reaction-picker"
import { SaveButton } from "@/components/post/save-button"
import { ShareButton } from "@/components/post/share-button"
import { ReportDialog } from "@/components/post/report-dialog"

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
  onOpen,
}: {
  imageUrls: string[]
  onOpen: (index: number) => void
}) {
  const n = imageUrls.length
  if (n === 0) return null

  const cellClass =
    "group relative block min-h-0 min-w-0 overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

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
      className={className ?? "object-cover transition-transform duration-300 group-hover:scale-[1.02]"}
      sizes={sizes}
      priority={priority}
    />
  )

  if (n === 1) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border/70 bg-muted/40 p-2.5 shadow-sm ring-1 ring-border/30">
        <button
          type="button"
          className="group relative block aspect-[16/9] w-full overflow-hidden rounded-lg bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onOpen(0)}
          aria-label="Open image"
        >
          <Img
            src={imageUrls[0]}
            alt=""
            sizes="(max-width: 768px) 88vw, 640px"
            priority
            className="object-contain object-center transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </button>
      </div>
    )
  }

  if (n === 2) {
    return (
      <div className="grid h-[220px] grid-cols-2 gap-0.5 overflow-hidden rounded-xl bg-border ring-1 ring-border/50">
        {imageUrls.slice(0, 2).map((src, i) => (
          <button
            key={i}
            type="button"
            className={cellClass}
            onClick={() => onOpen(i)}
            aria-label="Open image"
          >
            <Img src={src} alt="" sizes="(max-width: 768px) 50vw, 320px" priority={i === 0} />
          </button>
        ))}
      </div>
    )
  }

  if (n === 3) {
    return (
      <div className="grid h-[280px] grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-0.5 overflow-hidden rounded-xl bg-border ring-1 ring-border/50">
        <button
          type="button"
          className={`${cellClass} row-span-2`}
          onClick={() => onOpen(0)}
          aria-label="Open image"
        >
          <Img src={imageUrls[0]} alt="" sizes="(max-width: 768px) 60vw, 400px" priority />
        </button>
        <button type="button" className={cellClass} onClick={() => onOpen(1)} aria-label="Open image">
          <Img src={imageUrls[1]} alt="" sizes="(max-width: 768px) 40vw, 260px" />
        </button>
        <button type="button" className={cellClass} onClick={() => onOpen(2)} aria-label="Open image">
          <Img src={imageUrls[2]} alt="" sizes="(max-width: 768px) 40vw, 260px" />
        </button>
      </div>
    )
  }

  if (n === 4) {
    return (
      <div className="grid h-[300px] grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] grid-rows-2 gap-0.5 overflow-hidden rounded-xl bg-border ring-1 ring-border/50">
        <button type="button" className={cellClass} onClick={() => onOpen(0)} aria-label="Open image">
          <Img src={imageUrls[0]} alt="" sizes="(max-width: 768px) 55vw, 360px" priority />
        </button>
        <button type="button" className={cellClass} onClick={() => onOpen(1)} aria-label="Open image">
          <Img src={imageUrls[1]} alt="" sizes="(max-width: 768px) 45vw, 280px" />
        </button>
        <button type="button" className={cellClass} onClick={() => onOpen(2)} aria-label="Open image">
          <Img src={imageUrls[2]} alt="" sizes="(max-width: 768px) 55vw, 360px" />
        </button>
        <button type="button" className={cellClass} onClick={() => onOpen(3)} aria-label="Open image">
          <Img src={imageUrls[3]} alt="" sizes="(max-width: 768px) 45vw, 280px" />
        </button>
      </div>
    )
  }

  const left = [imageUrls[0], imageUrls[1]]
  const right = [imageUrls[2], imageUrls[3], imageUrls[4]]
  const extra = n > 5 ? n - 5 : 0

  return (
    <div className="flex h-[320px] gap-0.5 overflow-hidden rounded-xl bg-border ring-1 ring-border/50">
      <div className="flex min-w-0 flex-[1.55] flex-col gap-0.5">
        {left.map((src, i) => (
          <button
            key={i}
            type="button"
            className={`${cellClass} min-h-0 flex-1`}
            onClick={() => onOpen(i)}
            aria-label="Open image"
          >
            <Img src={src} alt="" sizes="(max-width: 768px) 58vw, 420px" priority={i === 0} />
          </button>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {right.map((src, i) => {
          const isLast = i === 2
          const idx = 2 + i
          return (
            <button
              key={i}
              type="button"
              className={`${cellClass} relative min-h-0 flex-1`}
              onClick={() => onOpen(idx)}
              aria-label="Open image"
            >
              <Img src={src} alt="" sizes="(max-width: 768px) 42vw, 300px" />
              {isLast && extra > 0 ? (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-semibold text-white">
                  +{extra}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PostCard({ post, viewerId = null, viewerRole = null }: PostCardProps) {
  const { t } = useLocale()
  const router = useRouter()
  const authorId = post.authorId ?? post.author.id
  const isAuthor = Boolean(viewerId && authorId && viewerId === authorId)
  const isAdmin = viewerRole === "ADMIN"
  const canEdit = isAuthor || isAdmin

  const images = parseMediaField(post.imageUrls)
  const videos = parseMediaField(post.videoUrls)
  const hasMedia = images.length > 0 || videos.length > 0

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    setCommentCount(post.commentCount ?? 0)
  }, [post.id, post.commentCount])

  const requireAuth = () => {
    if (!getAccessToken()) {
      toast.error(t("post.signInToast"))
      router.push("/auth")
      return false
    }
    return true
  }

  const onDeletePost = async () => {
    const ok = await confirmToast({
      title: t("post.deleteConfirm"),
      confirmText: t("post.deletePost"),
      cancelText: "Cancel",
    })
    if (!ok) return
    const res = await authFetch(`/posts/${post.id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error(t("post.deleteFail"))
      return
    }
    toast.success(t("post.deleted"))
    router.refresh()
  }

  return (
    <>
    <Lightbox
      open={lightboxOpen}
      onOpenChange={setLightboxOpen}
      images={images}
      index={lightboxIndex}
      onIndexChange={setLightboxIndex}
    />
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
              {canEdit ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground"
                      aria-label={t("post.optionsAria")}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href={`/post/edit/${post.slug}`} className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        {t("post.editPost")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => void onDeletePost()}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("post.deletePost")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground"
                      aria-label={t("post.optionsAria")}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={() => {
                        if (!requireAuth()) return
                        setReportOpen(true)
                      }}
                    >
                      <Flag className="h-4 w-4" />
                      {t("report.menuItem")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <Link href={`/post/${post.slug}`} className="group mt-2 block">
              <CardTitle className="line-clamp-2 text-lg font-bold leading-snug transition-colors group-hover:text-primary sm:text-xl">
                {post.title}
              </CardTitle>
            </Link>
            {post.category ? (
              <p className="mt-1.5">
                <span className="inline-flex rounded-full border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {post.category.name}
                </span>
              </p>
            ) : null}
            {post.description ? (
              <CardDescription className="mt-1 line-clamp-3 text-sm leading-relaxed">
                {post.description}
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>

      {hasMedia ? (
        <div className="border-t border-border/60 px-4 py-3 sm:px-5">
          {images.length > 0 ? (
            <PostMediaGrid
              imageUrls={images}
              onOpen={(idx) => {
                setLightboxIndex(idx)
                setLightboxOpen(true)
              }}
            />
          ) : videos[0] ? (
            <div className="space-y-2 -mx-1 sm:-mx-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("post.videoLabel")}
              </p>
              <div className="overflow-hidden rounded-2xl border bg-black ring-1 ring-border/40">
                <PostVideo
                  src={videos[0]}
                  muted
                  frameClassName="aspect-video w-full max-h-[min(420px,70vh)]"
                  className="w-full"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <CardContent className="space-y-3 pt-3 pb-4">
        <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
          <ReactionPicker
            postId={post.id}
            initialCount={post.likeCount ?? 0}
            onAuthRequired={requireAuth}
          />
          <SaveButton postId={post.id} onAuthRequired={requireAuth} />
          <ShareButton
            postId={post.id}
            initialShareCount={post.shareCount ?? 0}
            isAuthor={isAuthor}
            onAuthRequired={requireAuth}
          />
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
            {t("post.viewDetails")}
          </Link>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{t("post.communityPost")}</span>
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
    <ReportDialog
      targetKind="POST"
      targetId={post.id}
      open={reportOpen}
      onOpenChange={setReportOpen}
      onAuthRequired={requireAuth}
    />
    </>
  )
}

export default PostCard
