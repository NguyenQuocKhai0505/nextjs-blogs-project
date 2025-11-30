"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { getFollowersListAction } from "@/actions/follow-actions"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { formatDate } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface FollowersDialogProps {
    userId: string
    followerCount: number
}

interface FollowerUser {
    id: string
    name: string
    email: string
    avatar?: string | null
    followedAt: Date
}

export function FollowersDialog({ userId, followerCount }: FollowersDialogProps) {
    const [open, setOpen] = useState(false)
    const [followers, setFollowers] = useState<FollowerUser[]>([])
    const [loading, setLoading] = useState(false)

    const fetchFollowers = async () => {
        setLoading(true)
        try {
            const result = await getFollowersListAction(userId)
            if (result.success && result.followers) {
                setFollowers(result.followers as FollowerUser[])
            }
        } catch (error) {
            console.error("Error fetching followers:", error)
        } finally {
            setLoading(false)
        }
    }

    // Khi mở dialog, fetch danh sách followers
    useEffect(() => {
        if (open && followers.length === 0) {
            fetchFollowers()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, followers.length])

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="hover:underline cursor-pointer transition-colors"
                    onClick={() => setOpen(true)}
                >
                    <span className="font-semibold">{followerCount}</span>
                    <span className="text-sm text-muted-foreground ml-1">
                        {followerCount !== 1 ? "followers" : "follower"}
                    </span>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Followers</DialogTitle>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto space-y-3 mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : followers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No followers yet</p>
                    ) : (
                        followers.map((follower) => (
                            <div key={follower.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                                <Avatar>
                                    {follower.avatar && <AvatarImage src={follower.avatar} alt={follower.name} />}
                                    <AvatarFallback>
                                        {getInitials(follower.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{follower.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {follower.email}
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDate(follower.followedAt)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

