"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { getFollowingListAction } from "@/actions/follow-actions"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { formatDate } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface FollowingDialogProps {
    userId: string
    followingCount: number
}

interface FollowingUser {
    id: string
    name: string
    email: string
    avatar?: string | null
    followedAt: Date
}

export function FollowingDialog({ userId, followingCount }: FollowingDialogProps) {
    const [open, setOpen] = useState(false)
    const [following, setFollowing] = useState<FollowingUser[]>([])
    const [loading, setLoading] = useState(false)

    // Khi mở dialog, fetch danh sách following
    useEffect(() => {
        if (open && following.length === 0) {
            fetchFollowing()
        }
    }, [open])

    const fetchFollowing = async () => {
        setLoading(true)
        try {
            const result = await getFollowingListAction(userId)
            if (result.success && result.following) {
                setFollowing(result.following as FollowingUser[])
            }
        } catch (error) {
            console.error("Error fetching following:", error)
        } finally {
            setLoading(false)
        }
    }

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
                    <span className="font-semibold">{followingCount}</span>
                    <span className="text-sm text-muted-foreground ml-1">following</span>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Following</DialogTitle>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto space-y-3 mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : following.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Not following anyone yet</p>
                    ) : (
                        following.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                                <Avatar>
                                    {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                                    <AvatarFallback>
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{user.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {user.email}
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDate(user.followedAt)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

