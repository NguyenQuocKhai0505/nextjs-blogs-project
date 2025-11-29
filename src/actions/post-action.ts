"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { slugify } from "@/lib/utils"
import {eq} from "drizzle-orm"
import { deletePost } from "@/lib/db/queries"
//Create Post
export async function CreatePost(formData: FormData){
    try{
        //get the current user 

        //B1: Get userID from Session
        const session = await auth.api.getSession({
            headers: await headers()

        })
        if(!session || !session?.user){
            return{
                success: false,
                message:"You must be logged before creating post"
            }
        }
        //Get form data
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        const content = formData.get("content") as string

        //Validate empty fields 
        if(!title || !description || !content){
            return{
                success:false,
                message:"All fields are required"
            }
        }
        //Create the Slug from Post title 
        const slug= slugify(title)
        //Check if the slug aldreay exist
        const existingPost = await db.query.posts.findFirst({
            where: eq(posts.slug,slug)
        })
        if(existingPost){
            return{
                success: false,
                message: "A post with this title is aldready exist! Please create post with different title."
            }
        }
        //Get media from formData (if exists)
        const imageUrlsStr = formData.get("imageUrls") as string | null
        const imageUrls = imageUrlsStr ? JSON.parse(imageUrlsStr) : null
        const videoUrlsStr = formData.get("videoUrls") as string | null
        const videoUrls = videoUrlsStr ? JSON.parse(videoUrlsStr) : null

        //Post data into Database
        await db.insert(posts).values({
            title, description,content,slug,
            authorId:session.user.id,
            imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
            videoUrls: videoUrls ? JSON.stringify(videoUrls) : null
        }).returning()

        //Revalidatte the homepage to get the lastest post 
        revalidatePath("/")                 //display the lastest post
        revalidatePath(`/post/${slug}`)    //display new post
        revalidatePath("/profile")        //update the number of posts

        return{
            success: true,
            message: "Post created sucessfully",
            slug
        }
           
    }catch{
        return {
            success: false,
            message: "Failed to create post. Please try again."
        }
    }
}
//Update Post
export async function UpdatePost(formData:FormData){
   try{
     //B1: Get UserID from Session
     const session = await auth.api.getSession({
        headers: await headers()
    })
    if(!session || !session?.user){
        return{
            success: false,
            message:"You must be logged to update post"
        }
    }
    //B2: Get form data
    const postId = parseInt(formData.get("postId") as string)
    const slug = formData.get("slug") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const content = formData.get("content") as string 
    //B3: Validate
    if(!title || !description || !content || !postId){
        return{
            success: false,
            message: "All fields are required"
        }
    }
    //B4: Check post existing
    const existingPost = await db.query.posts.findFirst({
        where: eq(posts.id,postId)
    })
    //B5: Check role
    if(existingPost?.authorId !== session.user.id)
    {
        return{
            success: false,
            message:"You do not have permission to edit this post"
        }
    }
    //B6: if change title => change slug
    let newSlug = existingPost.slug
    if(title !== existingPost.title){
        newSlug = slugify(title)
        //Check slug 
        const duplicatePost = await db.query.posts.findFirst({
            where: eq(posts.slug,newSlug)
        })
        if(duplicatePost && duplicatePost.id !== postId){
            return{
                success: false,
                message: "A post with this title already exists!"
            }
        }
    }
    //B7: Get media from formData (if exists)
    const imageUrlsStr = formData.get("imageUrls") as string | null
    const imageUrls = imageUrlsStr ? JSON.parse(imageUrlsStr) : null
    const videoUrlsStr = formData.get("videoUrls") as string | null
    const videoUrls = videoUrlsStr ? JSON.parse(videoUrlsStr) : null

    //B8: Update post 
    const [updatedPost] = await db
        .update(posts)
        .set({
            title,
            description,
            content,
            slug: newSlug,
            imageUrls: imageUrls ? JSON.stringify(imageUrls) : existingPost.imageUrls, // Giữ nguyên nếu không có mới
            videoUrls: videoUrls ? JSON.stringify(videoUrls) : existingPost.videoUrls,
            updatedAt: new Date()
        })
        .where(eq(posts.id, postId))
        .returning()
    //B9: Validate paths 
    revalidatePath("/")
    revalidatePath(`/post/${newSlug}`)
    revalidatePath(`/post/${slug}`)  //Slug cu neu doi
    revalidatePath("/profile")
    return{
        success: true,
        message: "Post updated successfully",
        slug: newSlug
    }
   }catch(error){
    console.log(error)
    return{
        success: false,
        message:"Failed to update post. Please try again"
    }
   }
}
//Delete Post
export async function DeletePost(postId:number){
    try{
        //Kiem tra session
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if(!session || !session.user)
        {
            return{
                success: false,
                message:"You must be logged in to delete post"
            }
        }
        //Goi ham deletePost
        const result = await deletePost(postId, session.user.id)

        //Kiem tra ket qua
        if (result === null) {
            return {
                success: false,
                message: "Post not found"
            }
        }

        if (result === false) {
            return {
                success: false,
                message: "You don't have permission to delete this post"
            }
        }

        //Neu delete thanh cong -> Revalidate paths
        revalidatePath("/")
        revalidatePath("/profile")

        return {
            success: true,
            message: "Post deleted successfully"
        }

    }catch(error){
        console.log(error)
        return{
            success: false,
            message: "Failed to delete post. Please try again."
        }
    }
}
