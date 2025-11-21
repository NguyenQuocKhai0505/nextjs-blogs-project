"use server"


import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import { updateUserProfile } from "@/lib/db/queries"
import { success } from "better-auth"
interface UpdateProfileArgs{
    name?:string,
    avatar?:string | null
    avatarFile?:File | null
}
export async function updateProfileAction(data: UpdateProfileArgs){
    try{
        const session = await auth.api.getSession({
            headers: await headers()
        })
        if(!session || !session.user){
            return {
                success:false,
                message:"You must be logged in to update your profile"
            }
        }
        const userId = session.user.id 
        let avatarUrl= data.avatar ?? null

        if(data.avatarFile){
            try{
                const uploadResult = await uploadImageToCloudinary(data.avatarFile,{
                    folder:"profile_avatars"
                })
                avatarUrl = uploadResult.url
            }catch(e){
                console.error("Avatar upload failed: ",e)
                return{
                    success: false,
                    message:"Failed to upload avatar image"
                }
            }
        }

        const updatedUser = await updateUserProfile(userId,{
            name:data.name,
            avatar: avatarUrl
        })

        if(!updatedUser){
            return{
                success: false,
                message:"Failed to update profile"
            }
        }
        revalidatePath("/profile")
        revalidatePath("/")
        return {
            success:true,
            message:"Profile updated successfully",
            user: updatedUser
        }
    }catch(e){
        console.error("updateProfileAction error:",e)
        return {
            success: false,
            message:"Failed to update profile. Please try again"
        }
    }
}