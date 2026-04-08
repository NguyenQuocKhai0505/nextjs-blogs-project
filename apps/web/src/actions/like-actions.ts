"use server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { togglePostLike,checkUserLikedPost,getPostLikes } from "@/lib/db/queries"
import { getPostById } from "@/lib/db/queries"
import { createNotification } from "@/lib/db/notification-queries"
import { emitNotificationToUser } from "@/lib/realtime/notification-emitter"
import { getIO } from "@/lib/realtime/socket-server"

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
    //Lay lai post de co likeCount moi
    const updatedPost = await getPostById(postId)
    //Emit realtime cho room post: <postId>
    const io = getIO()
    if(io && updatedPost)
    {
        io.to(`post:${postId}`).emit("post_like_updated",{
            postId,
            likeCount: updatedPost.likeCount ?? 0,
            action: result.action,
        })
    }

    //Revalidate paths
    revalidatePath("/")
    revalidatePath(`/post/*`)

    if(result.action === "liked"){
        const post = await getPostById(postId)
        if(post && post.authorId !== session.user.id){
            const notification = await createNotification({
                userId: post.authorId,
                actorId: session.user.id,
                type: "like",
                meta: { postId: post.id, slug: post.slug }
            })
            emitNotificationToUser(post.authorId, notification)
        }
    }

    return{
        success: true,
        message: result.action === "liked" ? "Post liked!" : "Post unliked!",
        action: result.action
    }
    }catch(error){
        console.log("Toggle like action error: ",error)
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
    }catch{
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
    }catch{
        return{
            success: false,
            likes: []
        }
    }
}