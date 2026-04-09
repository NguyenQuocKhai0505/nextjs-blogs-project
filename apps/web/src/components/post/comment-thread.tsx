"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import { apiUrl } from "@/lib/api"
import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import { formatDate, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type ApiComment = {
  id: number
  postId: number
  parentId: number | null
  content: string
  createdAt: string
  author: { id: string; name: string; avatarUrl: string | null }
}

type CommentNode = ApiComment & { children: CommentNode[] }

function buildTree(flat: ApiComment[]): CommentNode[] {
  const byId = new Map<number, CommentNode>()
  for (const c of flat) {
    byId.set(c.id, { ...c, children: [] })
  }
  const roots: CommentNode[] = []
  for (const c of flat) {
    const node = byId.get(c.id)!
    if (c.parentId == null) {
      roots.push(node)
    } else {
      const p = byId.get(c.parentId)
      if (p) p.children.push(node)
      else roots.push(node)
    }
  }
  const sortNested = (nodes: CommentNode[]) => {
    nodes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    for (const n of nodes) sortNested(n.children)
  }
  sortNested(roots)
  return roots
}

type CommentThreadProps = {
  postId: number
  viewerId: string | null
  isPostAuthor: boolean
  /** Section id for deep links (e.g. #comments) */
  anchorId?: string
  /** Hide the in-page "Comments" heading (e.g. when used inside a dialog that already has a title). */
  showHeading?: boolean
  className?: string
  onTotalChange?: (total: number) => void
}

export default function CommentThread({
  postId,
  viewerId,
  isPostAuthor,
  anchorId,
  showHeading = true,
  className,
  onTotalChange,
}: CommentThreadProps) {
  const router = useRouter()
  const [flat, setFlat] = useState<ApiComment[]>([])
  const [loading, setLoading] = useState(true)
  const [topText, setTopText] = useState("")
  const [topSubmitting, setTopSubmitting] = useState(false)

  const loadComments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl(`/posts/id/${postId}/comments`), { cache: "no-store" })
      if (!res.ok) {
        setFlat([])
        return
      }
      const data = (await res.json()) as ApiComment[]
      const list = Array.isArray(data) ? data : []
      setFlat(list)
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    void loadComments()
  }, [loadComments])

  useEffect(() => {
    onTotalChange?.(flat.length)
  }, [flat.length, onTotalChange])

  const tree = useMemo(() => buildTree(flat), [flat])

  const requireAuth = () => {
    if (!getAccessToken()) {
      toast.error("Please sign in to continue.")
      router.push("/auth")
      return false
    }
    return true
  }

  const postComment = async (content: string, parentId: number | null) => {
    const body: { content: string; parentId?: number } = { content }
    if (parentId != null) body.parentId = parentId
    const res = await authFetch(`/posts/id/${postId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error("fail")
    return (await res.json()) as ApiComment
  }

  const onSubmitTop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requireAuth()) return
    const text = topText.trim()
    if (!text) return
    setTopSubmitting(true)
    try {
      const row = await postComment(text, null)
      setFlat((prev) => [...prev, row])
      setTopText("")
      toast.success("Comment added")
    } catch {
      toast.error("Could not post comment.")
    } finally {
      setTopSubmitting(false)
    }
  }

  const onDelete = async (commentId: number) => {
    if (!confirm("Delete this comment? Replies will be removed too.")) return
    const res = await authFetch(`/posts/id/${postId}/comments/${commentId}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      toast.error("Could not delete comment.")
      return
    }
    await loadComments()
    toast.success("Comment removed")
  }

  const canDelete = (c: ApiComment) =>
    Boolean(viewerId && (c.author.id === viewerId || isPostAuthor))

  return (
    <section id={anchorId} className={cn("scroll-mt-24 space-y-4", className)}>
      {showHeading ? <h2 className="text-lg font-semibold">Comments</h2> : null}

      <form onSubmit={(e) => void onSubmitTop(e)} className="space-y-2">
        <textarea
          placeholder={getAccessToken() ? "Write a comment…" : "Sign in to comment…"}
          value={topText}
          onChange={(e) => setTopText(e.target.value)}
          rows={3}
          disabled={topSubmitting}
          className={cn(
            "placeholder:text-muted-foreground w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        <Button type="submit" size="sm" disabled={topSubmitting || !topText.trim()}>
          {topSubmitting ? "Posting…" : "Post comment"}
        </Button>
      </form>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading comments…</p>
        ) : tree.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to reply.</p>
        ) : (
          tree.map((node) => (
            <CommentBranch
              key={node.id}
              node={node}
              depth={0}
              canDelete={canDelete}
              onDelete={onDelete}
              postComment={postComment}
              requireAuth={requireAuth}
              onPosted={(row) => setFlat((prev) => [...prev, row])}
            />
          ))
        )}
      </div>
    </section>
  )
}

function CommentBranch({
  node,
  depth,
  canDelete,
  onDelete,
  postComment,
  requireAuth,
  onPosted,
}: {
  node: CommentNode
  depth: number
  canDelete: (c: ApiComment) => boolean
  onDelete: (id: number) => void
  postComment: (content: string, parentId: number | null) => Promise<ApiComment>
  requireAuth: () => boolean
  onPosted: (row: ApiComment) => void
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replyBusy, setReplyBusy] = useState(false)

  const onReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requireAuth()) return
    const text = replyText.trim()
    if (!text) return
    if (node.parentId != null) {
      toast.error("You can only reply under a top-level comment.")
      return
    }
    setReplyBusy(true)
    try {
      const row = await postComment(text, node.id)
      onPosted(row)
      setReplyText("")
      setReplyOpen(false)
      toast.success("Reply posted")
    } catch {
      toast.error("Could not post reply.")
    } finally {
      setReplyBusy(false)
    }
  }

  const showReply = depth === 0

  return (
    <div className={cn("rounded-xl border bg-card/40", depth > 0 && "ml-4 border-l-2 border-l-border pl-3")}>
      <div className="flex gap-3 p-3">
        <Link
          href={`/profile/${node.author.id}`}
          className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border"
        >
          {node.author.avatarUrl ? (
            <Image src={node.author.avatarUrl} alt="" fill className="object-cover" sizes="36px" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-medium">
              {node.author.name?.charAt(0)?.toUpperCase() ?? "U"}
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/profile/${node.author.id}`} className="text-sm font-medium hover:underline">
                {node.author.name}
              </Link>
              <p className="text-xs text-muted-foreground">{formatDate(node.createdAt)}</p>
            </div>
            {canDelete(node) ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                aria-label="Delete comment"
                onClick={() => void onDelete(node.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{node.content}</p>
          {showReply ? (
            <div className="mt-2">
              {!replyOpen ? (
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setReplyOpen(true)}>
                  Reply
                </Button>
              ) : (
                <form onSubmit={(e) => void onReplySubmit(e)} className="mt-2 space-y-2">
                  <textarea
                    placeholder={`Reply to ${node.author.name}…`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    disabled={replyBusy}
                    className={cn(
                      "placeholder:text-muted-foreground w-full resize-none rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs outline-none",
                      "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    )}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="sm" disabled={replyBusy || !replyText.trim()}>
                      {replyBusy ? "Posting…" : "Post reply"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={replyBusy}
                      onClick={() => {
                        setReplyOpen(false)
                        setReplyText("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : null}
        </div>
      </div>
      {node.children.length > 0 ? (
        <div className="space-y-2 border-t border-border/40 px-1 pb-2 pt-1">
          {node.children.map((ch) => (
            <CommentBranch
              key={ch.id}
              node={ch}
              depth={depth + 1}
              canDelete={canDelete}
              onDelete={onDelete}
              postComment={postComment}
              requireAuth={requireAuth}
              onPosted={onPosted}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
