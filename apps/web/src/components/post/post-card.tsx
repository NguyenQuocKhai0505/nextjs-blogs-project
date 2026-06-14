"use client"

import { useEffect, useState } from "react"
import type { PostCardProps } from "@/lib/types"
import { Card } from "../ui/card"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { formatRelativeTime } from "@/lib/utils"
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
      <button
        type="button"
        className="group relative block aspect-[4/5] w-full max-h-[min(520px,70vh)] overflow-hidden bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:aspect-[16/10]"
        onClick={() => onOpen(0)}
        aria-label="Open image"
      >
        <Img
          src={imageUrls[0]}
          alt=""
          sizes="(max-width: 768px) 100vw, 640px"
          priority
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </button>
    )
  }

  if (n === 2) {
    return (
      <div className="grid h-[240px] grid-cols-2 gap-px overflow-hidden bg-border/60">
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
      <div className="grid h-[280px] grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-px overflow-hidden bg-border/60">
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
      <div className="grid h-[300px] grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] grid-rows-2 gap-px overflow-hidden bg-border/60">
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
    <div className="flex h-[320px] gap-px overflow-hidden bg-border/60">
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
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        <Link
          href={`/profile/${post.author.id}`}
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-primary/10"
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
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(post.createdAt)}
                {post.category ? (
                  <>
                    <span className="mx-1">·</span>
                    <span>{post.category.name}</span>
                  </>
                ) : null}
              </p>
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
        </div>
      </div>

      {(post.title || post.description) ? (
        <div className="space-y-1 px-4 pb-3">
          {post.title ? (
            <Link href={`/post/${post.slug}`} className="group block">
              <h3 className="line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-primary">
                {post.title}
              </h3>
            </Link>
          ) : null}
          {post.description ? (
            <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
              {post.description}
            </p>
          ) : null}
        </div>
      ) : null}

      {hasMedia ? (
        <div className="border-y border-border/50">
          {images.length > 0 ? (
            <PostMediaGrid
              imageUrls={images}
              onOpen={(idx) => {
                setLightboxIndex(idx)
                setLightboxOpen(true)
              }}
            />
          ) : videos[0] ? (
            <PostVideo
              src={videos[0]}
              muted
              frameClassName="aspect-video w-full max-h-[min(480px,70vh)]"
              className="w-full"
            />
          ) : null}
        </div>
      ) : null}

      <div className="px-2 pb-2 pt-1 sm:px-3">
        <div className="grid grid-cols-4 divide-x divide-border/40 border-t border-border/40">
          <div className="flex justify-center py-1">
            <ReactionPicker
              postId={post.id}
              initialCount={post.likeCount ?? 0}
              onAuthRequired={requireAuth}
              className="justify-center"
            />
          </div>
          <div className="flex justify-center py-1">
            <SaveButton postId={post.id} onAuthRequired={requireAuth} />
          </div>
          <div className="flex justify-center py-1">
            <ShareButton
              postId={post.id}
              initialShareCount={post.shareCount ?? 0}
              isAuthor={isAuthor}
              onAuthRequired={requireAuth}
            />
          </div>
          <div className="flex justify-center py-1">
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
              <MessageCircle className="h-4 w-4" />
              <span className="hidden text-xs font-medium sm:inline">{t("post.comment")}</span>
              {commentCount > 0 ? (
                <span className="text-xs font-medium">{commentCount}</span>
              ) : null}
            </Button>
          </div>
        </div>
      </div>
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
