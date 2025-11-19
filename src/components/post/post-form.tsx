"use client"

import { Label } from "@/components/ui/label"
import { z } from "zod"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"
import { CreatePost, UpdatePost } from "@/actions/post-action"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import Image from "next/image"
import { X, Link as LinkIcon, Loader2 } from "lucide-react"

//post form schema for validation
const postSchema = z.object({
    title: z.string().min(3,"Title must be at least 3 characters long").max(255,"Title must be less than 255 characters"),
    description:z.string().min(5,"Description must be at least 5 characters long").max(255,"Description must be less than 255 characters long"),
    content: z.string().min(10,"Content must be at least 10 characters long")
})

type PostFormValue = z.infer<typeof postSchema>

interface PostFormProps {
    post?: {
        id: number
        title: string
        description: string
        content: string
        slug: string
        imageUrls?: string[] | string | null
        videoUrls?: string[] | string | null
    }
    mode?: "create" | "edit"
}

function PostForm({ post, mode = "create" }: PostFormProps){
    const [isPending,startTransition] = useTransition()
    const router = useRouter()
    const parseMediaField = (media?: string[] | string | null) => {
        if (!media) return []
        if (Array.isArray(media)) return media
        try {
            return JSON.parse(media)
        } catch {
            return []
        }
    }
    const [imageUrls, setImageUrls] = useState<string[]>(() => parseMediaField(post?.imageUrls))
    const [videoUrls, setVideoUrls] = useState<string[]>(() => parseMediaField(post?.videoUrls))
    const [urlMediaType, setUrlMediaType] = useState<"image" | "video">("image")
    const [urlInput, setUrlInput] = useState("")
    const [isUploading,setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const {register,handleSubmit,formState:{errors}} = useForm<PostFormValue>({
        resolver: zodResolver(postSchema),
        defaultValues:{
            title: post?.title || "",
            description: post?.description || "",
            content: post?.content || ""
        }
    })
    //SUBMIT FORM
    const onFormSubmit = async(data:PostFormValue) =>{
        startTransition(async()=>{
            try{
                const formData = new FormData()
                formData.append("title",data.title)
                formData.append("description",data.description)  
                formData.append("content",data.content)

                if(imageUrls.length>0){
                    formData.append("imageUrls",JSON.stringify(imageUrls))
                }
                if(videoUrls.length>0){
                    formData.append("videoUrls",JSON.stringify(videoUrls))
                }

                let res;
                if (mode === "edit" && post) {
                    formData.append("postId", post.id.toString())
                    formData.append("slug", post.slug)
                    res = await UpdatePost(formData)
                } else {
                    res = await CreatePost(formData)
                }
                
                if(res.success){
                    toast(mode === "edit" ? "Post updated successfully!" : "Post created successfully!")
                    router.refresh()
                    if (mode === "edit") {
                        router.push(`/post/${res.slug || post?.slug}`)
                    } else {
                        router.push("/")
                    }
                }else{
                    toast(res.message)
                }
            }catch(e){
                toast(`Failed to ${mode === "edit" ? "update" : "create"} post!`)
            }
        })
    }
    //UPLOAD FILE
    const handleFileUpload = async (e:React.ChangeEvent<HTMLInputElement>) =>{
        const files = Array.from(e.target.files || [])
        if(files.length === 0) return 
        const IMAGE_TYPES = ["image/jpeg","image/jpg","image/png","image/webp","image/gif"]
        const VIDEO_TYPES = ["video/mp4","video/quicktime","video/webm"]
        const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
        const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

        for(const file of files){
            const isImage = IMAGE_TYPES.includes(file.type)
            const isVideo = VIDEO_TYPES.includes(file.type)
            if(!isImage && !isVideo){
                toast.error(`File ${file.name} is not a supported format`)
                return
            }
            const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
            if(file.size > maxSize){
                toast.error(`File ${file.name} exceeds ${isVideo ? "50MB" : "10MB"} limit`)
                return 
            }
        }
        setIsUploading(true)

        try{
            const formData = new FormData()
            files.forEach(file =>{
                formData.append("files", file)
            })
            const response = await fetch("/api/upload",{
                method:"POST",
                body:formData
            })
            const result = await response.json()

            if(result.success){
                setImageUrls(prev => [...prev, ...result.imageUrls])
                toast.success(`${result.imageUrls.length} image(s) uploaded successfully`)
            }else{
                toast.error(result.error || "Failed to upload images")
            }
        }catch(error){
            toast.error("Failed to upload images")
        }finally{
            setIsUploading(false)
            if(fileInputRef.current){
                fileInputRef.current.value = ""
            }
        }
    }
    //UPLOAD URL
    const handleUrlUpload = async () => {
        if (!urlInput.trim()) {
            toast.error("Please enter a media URL")
            return
        }
    
        setIsUploading(true)
        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ mediaUrl: urlInput.trim(), mediaType: urlMediaType })
            })
    
            const result = await response.json()
    
            if (result.success) {
                const newImages: string[] = result.imageUrls ?? []
                const newVideos: string[] = result.videoUrls ?? []
                if(newImages.length){
                    setImageUrls(prev => [...prev, ...newImages])
                }
                if(newVideos.length){
                    setVideoUrls(prev => [...prev, ...newVideos])
                }
                setUrlInput("")
                toast.success(`${urlMediaType === "image" ? "Image" : "Video"} uploaded from URL successfully!`)
            } else {
                toast.error(result.error || "Failed to upload media from URL")
            }
        } catch (error) {
            toast.error("Failed to upload media from URL")
        } finally {
            setIsUploading(false)
        }
    }
    //REMOVE IMAGE
    const removeImage = (index: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index))
    }
    const removeVideo = (index: number) => {
        setVideoUrls(prev => prev.filter((_, i) => i !== index))
    }
    return (
        <form className="space-y-6" onSubmit={handleSubmit(onFormSubmit)}>
            <div className="space-y-2">
                {/* Title */}
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter post title" {...register("title")} disabled={isPending}/>
                {
                    errors?.title && 
                    <p className="text-sm text-red-700">{errors.title.message}</p>
                }
            </div>
            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                    id="description"
                    placeholder="Enter a short post description"
                    className="w-full border rounded p-2"
                    rows={3}
                    {...register("description")}
                    disabled={isPending}
                />
                {
                    errors?.description && 
                    <p className="text-sm text-red-700">{errors.description.message}</p>
                }
            </div>
            {/* Content */}
            <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <textarea
                    id="content"
                    placeholder="Enter post content"
                    className="w-full border rounded p-2 min-h-[250px] resize-none"
                    rows={3}
                    {...register("content")}
                    disabled={isPending}
                />
                {
                    errors?.content && 
                    <p className="text-sm text-red-700">{errors.content.message}</p>
                }
            </div>
            
             {/* Media Upload Section */}
            <div className="space-y-4">
                <Label>Post Media (Images / Videos)</Label>
                
                {/* Upload từ files */}
                <div className="space-y-2">
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileUpload}
                        disabled={isPending || isUploading}
                        className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                        Upload multiple images (max 10MB each) or videos (mp4/mov/webm, max 50MB each)
                    </p>
                </div>

                {/* Upload từ URL */}
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <select
                            value={urlMediaType}
                            onChange={(e) => setUrlMediaType(e.target.value as "image" | "video")}
                            className="border rounded px-2 py-1 text-sm"
                            disabled={isPending || isUploading}
                        >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                        </select>
                        <Input
                            type="url"
                            placeholder={`Paste ${urlMediaType} URL here...`}
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            disabled={isPending || isUploading}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleUrlUpload()
                                }
                            }}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            onClick={handleUrlUpload}
                            disabled={isPending || isUploading || !urlInput.trim()}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LinkIcon className="h-4 w-4" />
                            )}
                            Upload
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Paste the URL, choose media type, then click upload
                    </p>
                </div>

                {/* Image Preview Grid */}
                {imageUrls.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Uploaded Images ({imageUrls.length})</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {imageUrls.map((url, index) => (
                                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                                    <Image
                                        src={url}
                                        alt={`Upload ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => removeImage(index)}
                                        disabled={isPending}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Video Preview Grid */}
                {videoUrls.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Uploaded Videos ({videoUrls.length})</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {videoUrls.map((url, index) => (
                                <div key={index} className="relative group rounded-lg overflow-hidden border">
                                    <video
                                        src={url}
                                        controls
                                        className="w-full h-52 bg-black"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => removeVideo(index)}
                                        disabled={isPending}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Button className="mt-5 w-full" disabled={isPending} type="submit">
                {
                    isPending 
                        ? (mode === "edit" ? "Updating Post..." : "Saving Post...") 
                        : (mode === "edit" ? "Update Post" : "Create Post")
                }
            </Button>
        </form>
    )
}
export default PostForm