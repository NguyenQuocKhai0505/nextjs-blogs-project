"use client"

import { useRef, useState } from "react"
import { Image as ImageIcon, Loader2, Type, Video, X } from "lucide-react"
import { toast } from "sonner"

import { apiUrl } from "@/lib/api"
import { authFetch } from "@/lib/auth-fetch"
import { STORY_TEXT_BACKGROUNDS } from "@/lib/types/stories"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/i18n/locale-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function StoryCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const { t } = useLocale()
  const [tab, setTab] = useState<"image" | "video" | "text">("image")
  const [text, setText] = useState("")
  const [bg, setBg] = useState<string>(STORY_TEXT_BACKGROUNDS[0])
  const [uploading, setUploading] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    const formData = new FormData()
    formData.append("files", file)
    const res = await fetch(apiUrl("/upload"), { method: "POST", body: formData })
    const result = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg =
        typeof result?.message === "string"
          ? result.message
          : "Upload failed"
      throw new Error(msg)
    }
    return result as { imageUrls?: string[]; videoUrls?: string[] }
  }

  async function createStory(body: Record<string, string>) {
    const res = await authFetch("/stories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.message ?? "Failed to create story")
    }
  }

  async function handleImage(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadFile(file)
      const url = result.imageUrls?.[0]
      if (!url) throw new Error("No image URL returned")
      await createStory({ imageUrl: url })
      toast.success(t("stories.created"))
      onCreated()
      onOpenChange(false)
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("stories.createFail"))
    } finally {
      setUploading(false)
    }
  }

  async function handleVideo(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadFile(file)
      const url = result.videoUrls?.[0]
      if (!url) throw new Error("No video URL returned")
      await createStory({ videoUrl: url })
      toast.success(t("stories.created"))
      onCreated()
      onOpenChange(false)
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("stories.createFail"))
    } finally {
      setUploading(false)
    }
  }

  async function handleTextSubmit() {
    const trimmed = text.trim()
    if (!trimmed) {
      toast.error(t("stories.textRequired"))
      return
    }
    setUploading(true)
    try {
      await createStory({ textContent: trimmed, backgroundColor: bg })
      toast.success(t("stories.created"))
      onCreated()
      onOpenChange(false)
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("stories.createFail"))
    } finally {
      setUploading(false)
    }
  }

  function reset() {
    setText("")
    setBg(STORY_TEXT_BACKGROUNDS[0])
    setTab("image")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("stories.createTitle")}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="image" className="gap-1.5">
              <ImageIcon className="h-4 w-4" />
              {t("stories.photo")}
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-1.5">
              <Video className="h-4 w-4" />
              {t("stories.video")}
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-1.5">
              <Type className="h-4 w-4" />
              {t("stories.text")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">{t("stories.photoHint")}</p>
            <input
              ref={imageRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void handleImage(e.target.files)}
            />
            <Button
              className="w-full rounded-xl"
              disabled={uploading}
              onClick={() => imageRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              {t("stories.choosePhoto")}
            </Button>
          </TabsContent>

          <TabsContent value="video" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">{t("stories.videoHint")}</p>
            <input
              ref={videoRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => void handleVideo(e.target.files)}
            />
            <Button
              className="w-full rounded-xl"
              disabled={uploading}
              onClick={() => videoRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Video className="mr-2 h-4 w-4" />
              )}
              {t("stories.chooseVideo")}
            </Button>
          </TabsContent>

          <TabsContent value="text" className="mt-4 space-y-3">
            <div
              className="flex min-h-[160px] items-center justify-center rounded-2xl p-4"
              style={{ backgroundColor: bg }}
            >
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("stories.textPlaceholder")}
                maxLength={500}
                className="min-h-[100px] resize-none border-0 bg-transparent text-center text-lg font-medium text-white placeholder:text-white/70 focus-visible:ring-0"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {STORY_TEXT_BACKGROUNDS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  className={cn(
                    "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-background",
                    bg === color ? "ring-primary" : "ring-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setBg(color)}
                />
              ))}
            </div>
            <Button
              className="w-full rounded-xl"
              disabled={uploading || !text.trim()}
              onClick={() => void handleTextSubmit()}
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("stories.publish")}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
