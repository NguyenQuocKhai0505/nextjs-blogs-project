import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary"

const IMAGE_TYPES = ["image/jpeg","image/jpg","image/png","image/webp","image/gif"]
const VIDEO_TYPES = ["video/mp4","video/quicktime","video/webm"]

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

type MediaType = "image" | "video"

type CloudinaryError = {
    message?: string
    http_code?: number
}

function isCloudinaryError(error: unknown): error is CloudinaryError & Error {
    if (typeof error === "object" && error !== null) {
        return "message" in error || "http_code" in error
    }
    return false
}

function getResourceType(mime: string): MediaType {
    if (IMAGE_TYPES.includes(mime)) return "image"
    if (VIDEO_TYPES.includes(mime)) return "video"
    return "image"
}

export async function POST(request: NextRequest){
   try{
    const contentType = request.headers.get("content-type")

    if(contentType?.includes("application/json")){
        const body = await request.json()
        const { mediaUrl, mediaType = "image" } = body as { mediaUrl?: string, mediaType?: MediaType }

        if(!mediaUrl || typeof mediaUrl !== "string"){
            return NextResponse.json(
                {error:"Invalid media URL"},
                {status:400}
            )
        }
        try{
            new URL(mediaUrl)
        }catch{
            return NextResponse.json(
                {error:"Invalid URL format"},
                {status: 400}
            )
        }
        
        try {
            const resourceType: MediaType = mediaType === "video" ? "video" : "image"
            const uploadOptions: Record<string, unknown> = {
                folder: "blog-posts",
                resource_type: resourceType,
            }
            if (resourceType === "image") {
                uploadOptions["transformation"] = [
                    {width:1920,height:1080,crop:"limit"},
                    {quality:"auto"}
                ]
            }

            const result = await cloudinary.uploader.upload(mediaUrl, uploadOptions)
            return NextResponse.json({
                success:true,
                imageUrls: resourceType === "image" ? [result.secure_url] : [],
                videoUrls: resourceType === "video" ? [result.secure_url] : [],
            })
        } catch (uploadError: unknown) {
            if (
                isCloudinaryError(uploadError) &&
                (uploadError.message?.includes("Invalid image") || uploadError.http_code === 400)
            ) {
                return NextResponse.json(
                    {error: "Invalid media URL or media cannot be accessed"},
                    {status: 400}
                )
            }
            throw uploadError
        }
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    
    if(!files || files.length === 0){
        return NextResponse.json(
            {error:"No file uploaded"},
            {status:400}
        )
    }
    
    const uploadPromises = files.map(async(file)=>{
        const resourceType = getResourceType(file.type)
        const allowedTypes = [...IMAGE_TYPES, ...VIDEO_TYPES]
        if(!allowedTypes.includes(file.type)){
            throw new Error(`Invalid file type: ${file.name}`)
        }

        const maxSize =
            resourceType === "video"
                ? 50 * 1024 * 1024  // 50MB for video
                : 10 * 1024 * 1024  // 10MB for image
        if(file.size > maxSize){
            throw new Error(`File ${file.name} exceeds ${resourceType === "video" ? "50MB" : "10MB"} limit`)
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        return new Promise<{ url: string, type: MediaType }>((resolve,reject)=>{
            cloudinary.uploader.upload_stream({
                resource_type: resourceType,
                folder:"blog-posts",
                ...(resourceType === "image" && {
                    transformation:[
                        {width: 1920, height: 1080, crop:"limit"},
                        {quality:"auto"}
                    ]
                })
            },
            (error,result)=>{
                if(error){
                    reject(error)
                }else if (result){
                    resolve({ url: result.secure_url, type: resourceType })
                }else{
                    reject(new Error("Upload Failed"))
                }
            }
        ).end(buffer)
        })
    })
    
    const media = await Promise.all(uploadPromises)
    const imageUrls = media.filter(item => item.type === "image").map(item => item.url)
    const videoUrls = media.filter(item => item.type === "video").map(item => item.url)

    return NextResponse.json({
        success:true,
        imageUrls,
        videoUrls
    })
   }
    catch(error: unknown){
        console.error("Upload error",error)
        
        if (
            isCloudinaryError(error) &&
            (error.message?.includes("Invalid image") || error.http_code === 400)
        ) {
            return NextResponse.json(
                {error: "Invalid media or cannot be accessed"},
                {status: 400}
            )
        }
        
        const message = error instanceof Error ? error.message : "Failed to upload files"
        return NextResponse.json(
            {error: message},
            {status:500}
        )
   }
}