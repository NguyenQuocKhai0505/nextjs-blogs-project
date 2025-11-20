"use client"

import { useState, useTransition } from "react"
import { Heart } from "lucide-react"
import { Button } from "../ui/button"
import { toggleLikeAction } from "@/actions/like-actions"
import { toast } from "sonner"
import { LikesDialog } from "./likes-dialog"

interface LikeButtonProps {
    postId: number
    initialLikeCount: number
    initialLiked: boolean
}

export function LikeButton({ postId, initialLikeCount, initialLiked }: LikeButtonProps) {
    // State để quản lý UI
    const [liked, setLiked] = useState(initialLiked)
    const [likeCount, setLikeCount] = useState(initialLikeCount)
    const [isPending, startTransition] = useTransition()

    // Handler khi click like button
    const handleLike = () => {
        startTransition(async () => {
            const result = await toggleLikeAction(postId)
            
            if (result.success) {
                // Cập nhật state
                setLiked(result.action === "liked")
                setLikeCount(prev => result.action === "liked" ? prev + 1 : prev - 1)
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        })
    }

    return (
        <div className="flex items-center gap-2">
            {/* Like Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isPending}
                className="gap-2"
            >
                <Heart
                    className={`h-5 w-5 transition-colors ${
                        liked 
                            ? "fill-red-500 text-red-500" 
                            : "text-muted-foreground hover:text-red-500"
                    }`}
                />
                <span className="text-sm font-medium">{likeCount}</span>
            </Button>

            {/* Likes Dialog - Click vào số like để xem danh sách */}
            {likeCount > 0 && (
                <LikesDialog postId={postId} likeCount={likeCount} />
            )}
        </div>
    )
}
