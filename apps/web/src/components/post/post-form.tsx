"use client"

import { Label } from "@/components/ui/label"
import { z } from "zod"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { X, Link as LinkIcon, Loader2, Plus } from "lucide-react"
import { apiUrl } from "@/lib/api"
import { authFetch } from "@/lib/auth-fetch"
import type { PostCategory } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAccessToken } from "@/lib/token"
import { useTheme } from "next-themes"

//post form schema for validation
const postSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters long")
    .max(255, "Title must be less than 255 characters"),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters long")
    .max(255, "Description must be less than 255 characters long"),
  content: z.string().min(10, "Content must be at least 10 characters long"),
  categoryId: z
    .string()
    .min(1, "Select a category")
    .transform((s) => Number.parseInt(s, 10))
    .refine((n) => Number.isFinite(n) && n > 0, "Select a category"),
})

type PostFormInput = z.input<typeof postSchema>
type PostFormOutput = z.output<typeof postSchema>

interface PostFormProps {
  post?: {
    id: number
    title: string
    description: string
    content: string
    slug: string
    imageUrls?: string[] | string | null
    videoUrls?: string[] | string | null
    categoryId?: number | null
  }
  mode?: "create" | "edit"
}

function PostForm({ post, mode = "create" }: PostFormProps){
    const [isPending,startTransition] = useTransition()
    const router = useRouter()
    const { resolvedTheme } = useTheme()
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
    const [categories, setCategories] = useState<PostCategory[]>([])
    const [viewerRole, setViewerRole] = useState<"USER" | "ADMIN" | null>(null)
    const isAdmin = viewerRole === "ADMIN"
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { register, handleSubmit, formState: { errors } } = useForm<
      PostFormInput,
      unknown,
      PostFormOutput
    >({
        resolver: zodResolver(postSchema),
        defaultValues:{
            title: post?.title || "",
            description: post?.description || "",
            content: post?.content || "",
            categoryId:
              post?.categoryId != null && post.categoryId > 0
                ? String(post.categoryId)
                : "",
        }
    })

    useEffect(() => {
      let cancelled = false
      void fetch(apiUrl("/categories"), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: unknown) => {
          if (cancelled) return
          if (!Array.isArray(data)) {
            setCategories([])
            return
          }
          const parsed: PostCategory[] = data
            .filter(
              (row): row is Record<string, unknown> =>
                row !== null && typeof row === "object"
            )
            .map((row) => ({
              id: Number(row.id),
              name: String(row.name ?? ""),
              slug: String(row.slug ?? ""),
              sortOrder: Number(row.sortOrder ?? 0),
            }))
            .filter((c) => Number.isFinite(c.id) && c.id > 0 && c.name.length > 0)
          setCategories(parsed)
        })
        .catch(() => {
          if (!cancelled) setCategories([])
        })
      return () => {
        cancelled = true
      }
    }, [])

    useEffect(() => {
      const token = getAccessToken()
      if (!token) {
        setViewerRole(null)
        return
      }
      let cancelled = false
      void authFetch("/me", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((me: unknown) => {
          if (cancelled) return
          const role =
            me && typeof me === "object" && "role" in me && (me as { role?: unknown }).role === "ADMIN"
              ? "ADMIN"
              : "USER"
          setViewerRole(role)
        })
        .catch(() => {
          if (!cancelled) setViewerRole(null)
        })
      return () => {
        cancelled = true
      }
    }, [])

    const [catDialogOpen, setCatDialogOpen] = useState(false)
    const [catName, setCatName] = useState("")
    const [catSlug, setCatSlug] = useState("")
    const [catSortOrder, setCatSortOrder] = useState("0")

    const createCategory = async () => {
      if (!isAdmin) return
      if (!catName.trim()) {
        toast.error("Category name is required")
        return
      }
      try {
        const res = await authFetch("/categories", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: catName.trim(),
            slug: catSlug.trim() ? catSlug.trim() : undefined,
            sortOrder: Number.parseInt(catSortOrder || "0", 10) || 0,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          throw new Error(err?.message ?? "Request failed")
        }
        toast.success("Category created")
        setCatDialogOpen(false)
        setCatName("")
        setCatSlug("")
        setCatSortOrder("0")
        // reload categories list from DB
        const next = await fetch(apiUrl("/categories"), { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [])
        if (Array.isArray(next)) {
          const parsed: PostCategory[] = next
            .filter((row): row is Record<string, unknown> => row !== null && typeof row === "object")
            .map((row) => ({
              id: Number(row.id),
              name: String(row.name ?? ""),
              slug: String(row.slug ?? ""),
              sortOrder: Number(row.sortOrder ?? 0),
            }))
            .filter((c) => Number.isFinite(c.id) && c.id > 0 && c.name.length > 0)
          setCategories(parsed)
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Create category failed")
      }
    }
    //SUBMIT FORM
    const onFormSubmit = async (data: PostFormOutput) => {
        startTransition(async()=>{
            try{
                const payload = {
                    title: data.title,
                    description: data.description,
                    content: data.content,
                    categoryId: data.categoryId,
                    imageUrls: imageUrls.length ? JSON.stringify(imageUrls) : null,
                    videoUrls: videoUrls.length ? JSON.stringify(videoUrls) : null,
                }

                const res = await (mode === "edit" && post
                    ? authFetch(`/posts/${post.id}`, {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify(payload),
                      })
                    : authFetch("/posts", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify(payload),
                      }))

                if (!res.ok) {
                    const err = await res.json().catch(() => null)
                    throw new Error(err?.message ?? "Request failed")
                }
                const out = await res.json()

                if(out){
                    toast(mode === "edit" ? "Post updated successfully!" : "Post created successfully!")
                    if (mode === "edit") {
                        router.push(`/post/${out.slug || post?.slug}`)
                        router.refresh()
                    } else {
                        router.push("/")
                        router.refresh()
                    }
                }
            }catch(e){
                const msg =
                  e instanceof Error && e.message
                    ? e.message
                    : `Failed to ${mode === "edit" ? "update" : "create"} post!`
                toast.error(msg)
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
            const response = await fetch(apiUrl("/upload"),{
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
        }catch{
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
            const response = await fetch(apiUrl("/upload"), {
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
        } catch {
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
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="categoryId">Category</Label>
                  {isAdmin ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xl"
                      onClick={() => setCatDialogOpen(true)}
                      disabled={isPending}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New category
                    </Button>
                  ) : null}
                </div>
                <select
                    id="categoryId"
                    style={{ colorScheme: resolvedTheme === "dark" ? "dark" : "light" }}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("categoryId")}
                    disabled={isPending || categories.length === 0}
                >
                    <option value="">
                        {categories.length === 0 ? "No categories — run DB migration" : "Select a category"}
                    </option>
                    {categories.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                            {c.name}
                        </option>
                    ))}
                </select>
                {errors?.categoryId ? (
                    <p className="text-sm text-red-700">{String(errors.categoryId.message)}</p>
                ) : null}
            </div>

            <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create category</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cat-name">Name</Label>
                    <Input
                      id="cat-name"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cat-slug">Slug (optional)</Label>
                    <Input
                      id="cat-slug"
                      value={catSlug}
                      onChange={(e) => setCatSlug(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cat-sort">Sort order</Label>
                    <Input
                      id="cat-sort"
                      value={catSortOrder}
                      onChange={(e) => setCatSortOrder(e.target.value)}
                      inputMode="numeric"
                      disabled={isPending}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setCatDialogOpen(false)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="rounded-xl"
                      onClick={() => void createCategory()}
                      disabled={isPending || !catName.trim()}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                            style={{ colorScheme: resolvedTheme === "dark" ? "dark" : "light" }}
                            className="border border-input bg-background text-foreground rounded px-2 py-1 text-sm"
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