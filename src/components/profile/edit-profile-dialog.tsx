"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Pencil, Upload, X } from "lucide-react"
import { toast } from "sonner"

interface EditProfileDialogProps {
    currentName: string
    currentEmail: string
    currentAvatar?: string | null
}

export function EditProfileDialog({ currentName, currentEmail, currentAvatar }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(currentName)
    const [avatarUrl, setAvatarUrl] = useState(currentAvatar || "")
    const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatar || null)
    const [isPending, setIsPending] = useState(false)

    const handleAvatarUrlChange = (url: string) => {
        setAvatarUrl(url)
        // Validate URL format
        try {
            new URL(url)
            setAvatarPreview(url)
        } catch {
            setAvatarPreview(null)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file")
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB")
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string)
            setAvatarUrl("") // Clear URL input when using file
        }
        reader.readAsDataURL(file)
    }

    const handleRemoveAvatar = () => {
        setAvatarUrl("")
        setAvatarPreview(null)
    }

    const handleSubmit = async(e:React.FormEvent)=>{
        e.preventDefault()
        setIsPending(true)
        try{
            //Upload file neu co 
            let avatarFile: File | null = null
            const fileInput = document.getElementById("avatar-file") as HTMLInputElement
            if(fileInput?.files?.[0])
            {
                avatarFile = fileInput.files[0]
            }
            //Goi server action
            const {updateProfileAction} = await import("@/actions/profile-action")
            const result = await updateProfileAction({
                name: name.trim(),
                avatar: avatarPreview || null,
                avatarFile: avatarFile
            })

            if(result?.success){
                toast.success(result.message || "Profile updated successfully")
                setOpen(false)
                window.location.reload() //Refresh de hien thi data moi
            }else{
                toast.error(result?.message || "Failed to update profile")
            }
        }catch(e){
            console.log("Error updating profile:",e)
            toast.error("Failed to update profile. Please try again")
        }finally{
            setIsPending(false)
        }
    }

    const getInitials = (name: string) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-background shadow-md"
                    title="Edit Profile"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-24 w-24">
                                {avatarPreview ? (
                                    <AvatarImage src={avatarPreview} alt={name} />
                                ) : null}
                                <AvatarFallback className="text-2xl">
                                    {getInitials(name)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        
                        {/* Avatar URL Input */}
                        <div className="w-full space-y-2">
                            <Label htmlFor="avatar-url">Avatar URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="avatar-url"
                                    type="url"
                                    placeholder="https://example.com/avatar.jpg"
                                    value={avatarUrl}
                                    onChange={(e) => handleAvatarUrlChange(e.target.value)}
                                    disabled={isPending}
                                    className="flex-1"
                                />
                                {avatarPreview && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleRemoveAvatar}
                                        disabled={isPending}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="w-full space-y-2">
                            <Label htmlFor="avatar-file">Or upload image</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="avatar-file"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={isPending}
                                    className="flex-1"
                                />
                                <Upload className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Max 5MB. JPG, PNG, or WebP
                            </p>
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            maxLength={255}
                            disabled={isPending}
                            required
                        />
                    </div>

                    {/* Email (readonly) */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={currentEmail}
                            disabled
                            className="bg-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">
                            Email cannot be changed
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || !name.trim()}>
                            {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

