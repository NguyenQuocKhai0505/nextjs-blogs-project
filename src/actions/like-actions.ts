
"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { togglePostLike,checkUserLikedPost,getPostLikes } from "@/lib/db/queries"
import { success } from "better-auth"

//TONGGLE LIKE ACTION
export async function toggleLikeAction(postId: number){
    try{
        const session = await auth.api.getSession({
            headers: await headers()
        })
    if(!session || !session.user){
        return{
            success: false,
            message: "You must be logged in to like posts"
        }
    }
    const result = await togglePostLike(postId, session.user.id)

    if(!result.success){
        return{
            success: false,
            message: "Failed to toggle like"
        }
    }

    //Revalidate paths
    revalidatePath("/")
    revalidatePath(`/post/*`)

    return{
        success: true,
        message: result.action === "liked" ? "Post liked!" : "Post unliked!",
        action: result.action
    }
    }catch(e){
        console.log("Toggle like action error: ",e)
        return{
            success: false,
            message: "Failed to toggle like"
        }
    }
}
//CHECK USER LIKED (FOR UI)
export async function checkUserLiked(postId:number){
    try{
        const session = await auth.api.getSession({
            headers: await headers()
        })
    if(!session || !session.user){
        return false
    }

    return await checkUserLikedPost(postId,session.user.id)
    }catch(e){
        return false
    }
}
//GET POST LIKES (FOR DIALOG)
export async function getPostLikeAction(postId:number)
{
    try{
        const likes = await getPostLikes(postId)
        return {
            success: true,
            likes: likes.map(like => ({
                id: like.user.id,
                name: like.user.name,
                email: like.user.email,
                likedAt: like.createdAt
            }))
        }
    }catch(e){
        return{
            success: false,
            likes: []
        }
    }
}