"use client"

import { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Pencil, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"
import { apiUrl } from "@/lib/api"

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

export interface EditProfileDialogProps {
  currentName: string
  currentEmail: string
  currentAvatar?: string | null
  currentBio?: string | null
}

export function EditProfileDialog({
  currentName,
  currentEmail,
  currentAvatar,
  currentBio,
}: EditProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [email, setEmail] = useState(currentEmail)
  const [bio, setBio] = useState(currentBio ?? "")
  const [avatarUrlInput, setAvatarUrlInput] = useState("")
  /** Resolved HTTPS URL for API (never a data: URL). */
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(currentAvatar ?? null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewSrc = blobPreviewUrl ?? resolvedAvatarUrl

  useEffect(() => {
    if (!open) return
    setName(currentName)
    setEmail(currentEmail)
    setBio(currentBio ?? "")
    setAvatarUrlInput("")
    setResolvedAvatarUrl(currentAvatar ?? null)
    setPendingFile(null)
    setBlobPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [open, currentName, currentEmail, currentAvatar, currentBio])

  useEffect(() => {
    return () => {
      if (blobPreviewUrl) URL.revokeObjectURL(blobPreviewUrl)
    }
  }, [blobPreviewUrl])

  const handleAvatarUrlBlur = () => {
    const raw = avatarUrlInput.trim()
    if (!raw) return
    try {
      const u = new URL(raw)
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        toast.error("Avatar URL must start with http or https")
        return
      }
      setResolvedAvatarUrl(raw)
      setPendingFile(null)
      if (blobPreviewUrl) {
        URL.revokeObjectURL(blobPreviewUrl)
        setBlobPreviewUrl(null)
      }
    } catch {
      toast.error("Invalid avatar URL")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Use JPG, PNG, WebP, or GIF")
      e.target.value = ""
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or less")
      e.target.value = ""
      return
    }
    setPendingFile(file)
    setAvatarUrlInput("")
    setResolvedAvatarUrl(null)
    setBlobPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const handleRemoveAvatar = () => {
    setAvatarUrlInput("")
    setResolvedAvatarUrl(null)
    setPendingFile(null)
    if (blobPreviewUrl) URL.revokeObjectURL(blobPreviewUrl)
    setBlobPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const uploadAvatarFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("files", file)
    const res = await fetch(apiUrl("/upload"), { method: "POST", body: formData })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg =
        typeof data?.message === "string"
          ? data.message
          : Array.isArray(data?.message)
            ? data.message.join(", ")
            : "Upload failed"
      throw new Error(msg)
    }
    const url = data?.imageUrls?.[0] as string | undefined
    if (!url) throw new Error("No image URL returned")
    return url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    setIsPending(true)
    try {
      let finalAvatar: string | null = null
      if (pendingFile) {
        finalAvatar = await uploadAvatarFile(pendingFile)
      } else {
        const typed = avatarUrlInput.trim()
        if (typed) {
          try {
            const u = new URL(typed)
            if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("protocol")
            finalAvatar = typed
          } catch {
            toast.error("Avatar URL must be a valid http(s) link")
            setIsPending(false)
            return
          }
        } else {
          finalAvatar = resolvedAvatarUrl
        }
      }

      const res = await authFetch("/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          avatarUrl: finalAvatar,
          bio: bio.trim() === "" ? null : bio.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const msg =
          typeof err?.message === "string"
            ? err.message
            : Array.isArray(err?.message)
              ? err.message.join(", ")
              : "Failed to update profile"
        toast.error(msg)
        return
      }

      toast.success("Profile updated")
      setOpen(false)
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsPending(false)
    }
  }

  const getInitials = (n: string) => {
    if (!n) return "U"
    return n
      .split(" ")
      .map((x) => x[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
          title="Edit profile"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-24 w-24 border border-border">
              {previewSrc ? <AvatarImage src={previewSrc} alt="" /> : null}
              <AvatarFallback className="text-2xl">{getInitials(name)}</AvatarFallback>
            </Avatar>

            <div className="w-full space-y-2">
              <Label htmlFor="avatar-url">Avatar image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="avatar-url"
                  type="url"
                  placeholder="https://…"
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  onBlur={() => handleAvatarUrlBlur()}
                  disabled={isPending}
                />
                {previewSrc ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRemoveAvatar}
                    disabled={isPending}
                    title="Remove avatar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="w-full space-y-2">
              <Label htmlFor="avatar-file">Or upload image</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="avatar-file"
                  type="file"
                  accept={IMAGE_TYPES.join(",")}
                  onChange={handleFileChange}
                  disabled={isPending}
                  className="flex-1"
                />
                <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Max 5MB. JPG, PNG, WebP, or GIF.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-name">Display name</Label>
            <Input
              id="ep-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-email">Email</Label>
            <Input
              id="ep-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-bio">Bio</Label>
            <Textarea
              id="ep-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={2000}
              rows={4}
              disabled={isPending}
              placeholder="A few words about you…"
              className="resize-y min-h-[88px]"
            />
            <p className="text-xs text-muted-foreground">{bio.length}/2000</p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
