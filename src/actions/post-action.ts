"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { slugify } from "@/lib/utils"
import {eq} from "drizzle-orm"
import { success } from "better-auth"
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
        //Post data into Database
        const [newPost] = await db.insert(posts).values({
            title, description,content,slug,
            authorId:session.user.id
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
           
    }catch(e){
        return {
            success: false,
            message: "Failed to create post. Please try again."
        }
    }
}