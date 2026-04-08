"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { getPostLikeAction } from "@/actions/like-actions"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { formatDate } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LikesDialogProps {
    postId: number
    likeCount: number
}

interface LikeUser {
    id: string
    name: string
    email: string
    likedAt: Date
}

export function LikesDialog({ postId, likeCount }: LikesDialogProps) {
    const [open, setOpen] = useState(false)
    const [likes, setLikes] = useState<LikeUser[]>([])
    const [loading, setLoading] = useState(false)

    const fetchLikes = async () => {
        setLoading(true)
        try {
            const result = await getPostLikeAction(postId)
            if (result.success && result.likes) {
                setLikes(result.likes as LikeUser[])
            }
        } catch (error) {
            console.error("Error fetching likes:", error)
        } finally {
            setLoading(false)
        }
    }

    // Khi mở dialog, fetch danh sách likes
    useEffect(() => {
        if (open && likes.length === 0) {
            fetchLikes()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, likes.length])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline cursor-pointer"
                    onClick={() => setOpen(true)}
                >
                    {likeCount} {likeCount === 1 ? "like" : "likes"}
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Likes</DialogTitle>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto space-y-3 mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : likes.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No likes yet</p>
                    ) : (
                        likes.map((like) => (
                            <div key={like.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                                <Avatar>
                                    <AvatarFallback>
                                        {like.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{like.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {like.email}
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDate(like.likedAt)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

