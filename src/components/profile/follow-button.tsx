"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { toggleFollowAction } from "@/actions/follow-actions"
import { toast } from "sonner"

interface FollowButtonProps{
    targetUserId:string,
    initialFollowing: boolean,
    disabled?: boolean
}
export function FollowButton({targetUserId, initialFollowing, disabled}:FollowButtonProps){
    const [following, setFollowing] = useState(initialFollowing)
    const [pending, startTransition] = useTransition()

    
 
    const handleClick = () => {
        startTransition(async () => {
          const previous = following
          setFollowing(!previous)
    
          const result = await toggleFollowAction(targetUserId)
          
          // Nếu thất bại, revert lại trạng thái cũ
          if (!result?.success) {
            setFollowing(previous)
            toast.error(result?.message || "Failed to update follow status")
          } else {
            // Nếu thành công, hiển thị thông báo phù hợp
            // Kiểm tra an toàn với optional chaining
            if (result && 'action' in result) {
              const actionMessage = result.action === "followed" ? "Followed" : 
                                   result.action === "unfollowed" ? "Unfollowed" : 
                                   "Updated successfully"
              toast.success(actionMessage)
            } else {
              toast.success("Updated successfully")
            }
          }
        })
      }
      return (
        <Button onClick={handleClick} disabled={pending || disabled} variant={following ? "outline" : "default"}>
          {following ? "Following" : "Follow"}
        </Button>
      )
}
