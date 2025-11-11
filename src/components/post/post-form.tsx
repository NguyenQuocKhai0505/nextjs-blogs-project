"use client"

import { Label } from "@/components/ui/label"
import { z } from "zod"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"

//post form schema for validation
const postSchema = z.object({
    title: z.string().min(3,"Title must be at least 2 characters long").max(255,"Title must be less than 255 charaters"),
    description:z.string().min(5,"Description must be at lease 5 characters long").max(255,"Description must be less than 255 characters long"),
    content: z.string().min(10,"Content must be at least 10 characters long").max(255,"Content must be less than 255 characters long")
})

type PostFormValue = z.infer<typeof postSchema>
function PostForm(){
    const [isPending,startTransition] = useTransition()
    const {register,handleSubmit,formState:{errors}} = useForm<PostFormValue>({
        resolver: zodResolver(postSchema),
        defaultValues:{
            title:"",
            description:"",
            content:""
        }
    })
    const onFormSubmit = async(data:PostFormValue) =>{
        console.log(data)
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
                    isPending ? "Saving Post..." : "Create Post"
                }
            </Button>
        </form>
    )
}
export default PostForm