"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import CommentThread from "./comment-thread"

type CommentThreadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: number
  postTitle: string
  viewerId: string | null
  isPostAuthor: boolean
  onCommentCountChange?: (count: number) => void
}

export default function CommentThreadDialog({
  open,
  onOpenChange,
  postId,
  postTitle,
  viewerId,
  isPostAuthor,
  onCommentCountChange,
}: CommentThreadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,720px)] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
          <DialogTitle className="line-clamp-2 pr-8 text-base">Comments</DialogTitle>
          <DialogDescription className="line-clamp-2 text-left">{postTitle}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {open ? (
            <CommentThread
              postId={postId}
              viewerId={viewerId}
              isPostAuthor={isPostAuthor}
              showHeading={false}
              onTotalChange={onCommentCountChange}
              className="space-y-3"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
