"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import {
  toggleFollow,
  checkUserFollowing,
  getFollowerCount,
  getFollowingCount,
  getFollowersList,
  getFollowingList
} from "@/lib/db/queries"
import { revalidatePath } from "next/cache"

export async function toggleFollowAction(targetuserId:string)
{
    const session = await auth.api.getSession({ headers: await headers() })
    if(!session?.user) {
        return {
            action: null,
            success: false, 
            message: "You must be logged in first"
        }
    }

    const result = await toggleFollow(session.user.id, targetuserId)

    if(result?.success){
        revalidatePath("/profile")
        revalidatePath(`/profile/${targetuserId}`) 
    }
    return result
}
export async function checkFollowingAction(targetUserId: string)
{
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if(!session?.user) return false 
    return checkUserFollowing(session.user.id,targetUserId)
}
export async function getFollowersStatsAction(userId:string)
{
    const [followers, following] = await Promise.all([
        getFollowerCount(userId),
        getFollowingCount(userId)
    ])
    return {followers,following}
}
//GET FOLLOWERS LIST (FOR DIALOG)
export async function getFollowersListAction(userId: string)
{
    try{
        const followers = await getFollowersList(userId)
        return {
            success: true,
            followers: followers.map(follow => ({
                id: follow.follower.id,
                name: follow.follower.name,
                email: follow.follower.email,
                avatar: follow.follower.avatar,
                followedAt: follow.createdAt
            }))
        }
    } catch(e){
        console.error("Get followers list action error:", e)
        return {
            success: false,
            followers: []
        }
    }
}
//GET FOLLOWING LIST (FOR DIALOG)
export async function getFollowingListAction(userId: string)
{
    try{
        const following = await getFollowingList(userId)
        return {
            success: true,
            following: following.map(follow => ({
                id: follow.following.id,
                name: follow.following.name,
                email: follow.following.email,
                avatar: follow.following.avatar,
                followedAt: follow.createdAt
            }))
        }
    } catch(e){
        console.error("Get following list action error:", e)
        return {
            success: false,
            following: []
        }
    }
}