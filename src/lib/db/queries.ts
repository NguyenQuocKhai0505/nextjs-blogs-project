import { desc, eq } from "drizzle-orm"
import { db } from "."
import {posts} from "./schema"
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