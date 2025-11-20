import { desc, eq } from "drizzle-orm"
import { db } from "."
import {posts} from "./schema"
import { postLikes,comments } from "./schema"
import {and} from "drizzle-orm"
import { sql } from "drizzle-orm"
import { success } from "better-auth"
//GET ALL POST
export async function getAllPost(){
    try{
        const allPosts = await db.query.posts.findMany({
            orderBy: [desc(posts.createdAt)],
            with:{
                author:true
            }
        })
        return allPosts
    }catch(e){
        console.log(e)
        return[]
    }
}
//GET POST BY SLUG
export async function getPostBySlug(slug:string)
{
    try{
        const post = await db.query.posts.findFirst({
            where: eq(posts.slug,slug),
            with:{
                author:true
            }
        })
        return post || null
    }catch(e){
        console.log(e)
        return null
    }
}
//UPDATE POST
export async function updatePost(
    postId: number,
    data:{
        title: string,
        description: string,
        content: string,
        slug?: string   //Neu doi title thi cung doi slug
    }
){
    try{
        const [updatedPost] = await db
            .update(posts)
            .set({
                ...data,
                updatedAt: new Date() //cap nhat thoi gian
            })
            .where(eq(posts.id,postId))
            .returning()
        return updatedPost
    }catch(e){
        console.log(e)
        return null
    }
}
//DELETE POST
export async function deletePost(postId: number, userId: string) {
    try {
        // B1: Kiểm tra post tồn tại và lấy post
        const post = await db.query.posts.findFirst({
            where: eq(posts.id, postId)
        })

        // B2: Kiểm tra post có tồn tại không
        if (!post) {
            return null  // Post không tồn tại
        }

        // B3: KIỂM TRA QUYỀN - CHỈ AUTHOR MỚI ĐƯỢC DELETE
        // So sánh: post.authorId === userId
        if (post.authorId !== userId) {
            return false  // Không có quyền delete
        }

        // B4: Xóa post từ database
        await db.delete(posts).where(eq(posts.id, postId))
        
        return true  // Delete thành công
    } catch (e) {
        console.log(e)
        return null  // Có lỗi xảy ra
    }
}
//TOGGLE LIKE 
export async function togglePostLike(postId:number, userId:string)
{
    try{
        //Kiem tra user da like hay chua
        const existingLike = await db.query.postLikes.findFirst({
            where: and(
                eq(postLikes.postId,postId),
                eq(postLikes.userId, userId)
            )
        }) 
        if(existingLike){
            //da like -> unlike 
            await db.delete(postLikes).where(
                and(
                    eq(postLikes.postId,postId),
                    eq(postLikes.userId,userId)
                )
            )
            //Giam like count 
            await db.update(posts)
                .set({
                    likeCount: sql`${posts.likeCount} -1`,
                    updatedAt: new Date()
                })
                .where(
                    eq(posts.id,postId)
                )
                return {action: "unliked",success: true}
        }else{
            //Chua like thi like
            await db.insert(postLikes).values({
                postId,
                userId,
            })
            //Tang like count 
            await db.update(posts)
                .set({
                    likeCount: sql`${posts.likeCount} + 1`,
                    updatedAt: new Date()
                })
                .where(eq(posts.id,postId))
                return {action: "liked", success: true}
        }
    }catch(e){
        console.log("Toggle like error:",e)
        return {action: null, success: false}
    }
}
//Check if user liked post
export async function checkUserLikedPost(postId: number, userId: string){
    try{
        const like = await db.query.postLikes.findFirst({
            where: and(
                eq(postLikes.postId,postId),
                eq(postLikes.userId,userId)
            )
        })
        return !!like
    }catch(e){
        console.log("Check like error: ",e)
        return false
    }
}
//GET POST LIKES 
export async function getPostLikes(postId: number){
    try{
        const likes = await db.query.postLikes.findMany({
            where: eq(postLikes.postId,postId),
            with:{
                user: true
            },
            orderBy: [desc(postLikes.createdAt)]
        })
        return likes
    }catch(e){
        console.log("Get likes error:",e)
        return []
    }
}
//CREATE COMMENT 
export async function createComment (postId: number, authorId: string, content: string, parentId?: number){
    try{
        const [newComment] = await db.insert(comments).values({
            postId,
            authorId,
            content,
            parentId: parentId || null
        }).returning()
        //Tang comment count 
        await db.update(posts)
            .set({
                commentCount: sql`${posts.commentCount} + 1`,
                updatedAt: new Date()

            })
            .where(eq(posts.id,postId))
        return newComment
    }catch(e){
        console.log("Create comment error: ",e)
        return null
    }
}
//DELETE COMMENT 
export async function deleteComment(commentId: number,userId:string)
{
    try{
        //Kiem tra comment ton tai 
        const comment = await db.query.comments.findFirst({
            where: eq(comments.id,commentId)
        })
        if(!comment){
            return null //comment khong ton tai
        }

        //Kiem tra truy cap (chi author moi duoc xoa)
        if(comment.authorId !== userId){
            return false
        }
        //Xoa comment 
        await db.delete(comments).where(eq(comments.id,commentId))

        //Giam comment count 
        await db.update(posts)
            .set({
                commentCount: sql`${posts.commentCount} - 1`,
                updatedAt: new Date()
            })
            .where(eq(posts.id,comment.postId))
        
        return true
    }catch(e){
        console.log("Delete Comment Error: ",e)
        return null
    }
}
// GET POST COMMENTS - Lấy danh sách comments của post
export async function getPostComments(postId: number) {
    try {
        const postComments = await db.query.comments.findMany({
            where: eq(comments.postId, postId),
            with: {
                author: true
            },
            orderBy: [desc(comments.createdAt)]
        })
        return postComments
    } catch (e) {
        console.log("Get comments error:", e)
        return []
    }
}
//GET POST BY USER ID 
export async function getPostByUserId(userId:string)
{
    try{
        const userPosts = await db.query.posts.findMany({
            where: eq(posts.authorId,userId),
            orderBy:[desc(posts.createdAt)],
            with:{
                author:true
            }
        })
        return userPosts
    }catch(e){
        console.log("Get posts by User ID error: ",e)
        return []
    }
}