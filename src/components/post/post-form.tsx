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
    }
    mode?: "create" | "edit"
}

function PostForm({ post, mode = "create" }: PostFormProps){
    const [isPending,startTransition] = useTransition()
    const router = useRouter()
    const {register,handleSubmit,formState:{errors}} = useForm<PostFormValue>({
        resolver: zodResolver(postSchema),
        defaultValues:{
            title: post?.title || "",
            description: post?.description || "",
            content: post?.content || ""
        }
    })
    const onFormSubmit = async(data:PostFormValue) =>{
        startTransition(async()=>{
            try{
                const formData = new FormData()
                formData.append("title",data.title)
                formData.append("description",data.description)  
                formData.append("content",data.content)
                
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