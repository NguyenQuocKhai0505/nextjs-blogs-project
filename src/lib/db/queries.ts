import { desc, eq, ilike } from "drizzle-orm"
import { db } from "."
import {follows, posts} from "./schema"
import { postLikes,comments } from "./schema"
import {and,or} from "drizzle-orm"
import { sql } from "drizzle-orm"
import { success } from "better-auth"
import {users} from "./schema"

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

export async function getPostById(postId: number) {
    try {
        const post = await db.query.posts.findFirst({
            where: eq(posts.id, postId),
            with: {
                author: true,
            },
        })
        return post || null
    } catch (e) {
        console.log("Get post by id error:", e)
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
//UPDATE USER PROFILE
export async function updateUserProfile(
    userId: string,
    data:{
        name?:string,
        avatar?:string | null,
    }
){
    try{
        const updateData: {
            updatedAt: Date
            name?: string
            avatar?: string | null
        } = {
            updatedAt: new Date()
        }
        if(data.name !== undefined){
            updateData.name = data.name
        }
        if(data.avatar !== undefined){
            updateData.avatar = data.avatar
        }
        const [updateUser] = await db
           .update(users)
           .set(updateData)
           .where(eq(users.id,userId))
           .returning()

        return updateUser || null

    }catch(e){
        console.error("Error updating user profile:",e)
        return null
    }
}
//GET USER BY ID 
export async function getUserById(userId:string){
    try{
        const user = await db.query.users.findFirst({
            where: eq(users.id,userId)
        })
        return user || null
    }catch(e){
        console.error("Error getting user by ID: ",e)
        return null
    }
}
//TOGGLE FOLLOW 
export async function toggleFollow(followerId:string, followingId: string)
{
    try{
        if(followerId === followingId)
        {
            return{
                action: null,
                success: false,
                message:"You cannot follow yourself"
            }
        }
        const existing = await db.query.follows.findFirst({
            where:and(eq(follows.followerId,followerId),eq(follows.followingId,followingId))
        })
        if(existing){
            // Đã follow rồi -> Unfollow (xóa)
            await db
                .delete(follows)
                .where(and(eq(follows.followerId,followerId),(eq(follows.followingId,followingId))))
            return{
                action:"unfollowed",
                success: true
            }
        } else {
            // Chưa follow -> Follow (thêm)
            await db.insert(follows).values({
                followerId,
                followingId
            })
            return{
                action:"followed",
                success: true
            }
        }
    } catch(e){
        console.error("Toggle follow error:", e)
        return{
            action: null,
            success: false,
            message: "Failed to update follow status"
        }
    }
}
//CHECK FOLLOWING
export async function checkUserFollowing(followerId:string,followingId:string)
{
    try{
        if(!followerId || !followingId || followerId === followingId) return false
        const follow = await db.query.follows.findFirst({
            where:and(eq(follows.followerId,followerId),eq(follows.followingId,followingId))
        })
        return !!follow // Convert to boolean: true nếu follow tồn tại, false nếu không
    } catch(e){
        console.error("Check following error:", e)
        return false
    }
}
//GET FOLLOWER COUNT 
export async function getFollowerCount(userId:string)
{
    try{
        const [row] = await db 
            .select({count: sql<number>`cast(count(*) as int)`})
            .from(follows)
            .where(eq(follows.followingId,userId))
        return row?.count ?? 0
    } catch(e){
        console.error("Get follower count error:", e)
        return 0
    }
}
//GET FOLLOWING COUNT 
export async function getFollowingCount(userId:string)
{
    try{
        const [row] = await db 
            .select({count:sql<number>`cast(count(*) as int)`})
            .from(follows)
            .where(eq(follows.followerId,userId))
        return row?.count ?? 0
    } catch(e){
        console.error("Get following count error:", e)
        return 0
    }
}
//GET FOLLOWER LIST - Lấy danh sách những người đang follow user này
export async function getFollowersList(userId: string)
{
    try{
        const followers = await db.query.follows.findMany({
            where: eq(follows.followingId, userId), // Những người follow userId này
            with: {
                follower: true // Lấy thông tin user (follower)
            },
            orderBy: [desc(follows.createdAt)]
        })
        return followers
    } catch(e){
        console.error("Get followers list error:", e)
        return []
    }
}
//GET FOLLOWING LIST - Lấy danh sách những người mà user này đang follow
export async function getFollowingList(userId: string)
{
    try{
        const following = await db.query.follows.findMany({
            where: eq(follows.followerId, userId), // Những người mà userId này đang follow
            with: {
                following: true // Lấy thông tin user (following)
            },
            orderBy: [desc(follows.createdAt)]
        })
        return following
    } catch(e){
        console.error("Get following list error:", e)
        return []
    }
}

export async function getFollowingUsers(userId: string) {
    try{
        const rows = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                avatar: users.avatar,
            })
            .from(follows)
            .innerJoin(users, eq(follows.followingId, users.id))
            .where(eq(follows.followerId, userId))
        return rows
    } catch(e){
        console.error("Get following users error:", e)
        return []
    }
}

export async function getFollowersUsers(userId: string) {
    try{
        const rows = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                avatar: users.avatar,
            })
            .from(follows)
            .innerJoin(users, eq(follows.followerId, users.id))
            .where(eq(follows.followingId, userId))
        return rows
    } catch(e){
        console.error("Get followers users error:", e)
        return []
    }
}
//SEARCH USER BY NAME/EMAIL (case-insensitive, partial match)
export async function searchUsers(query: string, maxResults: number = 20)
{
    try{
        if (!query || query.trim().length === 0) return []

        const searchTerm = `%${query.trim()}%`
        const results = await db
          .select()
          .from(users)
          .where(
            or(
              ilike(users.name, searchTerm),
              ilike(users.email, searchTerm)
            )
          )
          .limit(maxResults)
          .orderBy(users.name)
    
        return results

    }catch(e){
        console.error("Search users error:", e)
        return []
    }
}