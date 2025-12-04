"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Video as VideoIcon, Send } from "lucide-react"
import { cn } from "@/lib/utils"

type MessageInputProps = {
  onSend: (payload: { content?: string; imageUrl?: string; videoUrl?: string }) => void
  disabled?: boolean
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState("")
  const [pendingMedia, setPendingMedia] = useState<{ type: "image" | "video"; url: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Giới hạn dung lượng: ảnh 5MB, video 50MB
    const maxSize = type === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      console.error("File too large")
      event.target.value = ""
      return
    }

    const formData = new FormData()
    formData.append("files", file)

    try {
      setUploading(true)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Failed to upload media")
      const data = await res.json()
      const url =
        type === "image" ? data.imageUrls?.[0] : data.videoUrls?.[0]
      if (!url) throw new Error("No media URL returned")

      setPendingMedia({ type, url })
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  const handleSend = () => {
    if (disabled || uploading) return
    if (!value.trim() && !pendingMedia) return

    onSend({
      content: value.trim() || undefined,
      imageUrl: pendingMedia?.type === "image" ? pendingMedia.url : undefined,
      videoUrl: pendingMedia?.type === "video" ? pendingMedia.url : undefined,
    })

    setValue("")
    setPendingMedia(null)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-3 border-t px-4 py-3">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFileSelected(e, "image")}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={e => handleFileSelected(e, "video")}
      />

      <div className="flex flex-col gap-2 flex-1">
        {pendingMedia && (
          <div className="rounded-lg border bg-muted px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-start justify-between gap-2">
              {pendingMedia.type === "image" ? (
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Image will be sent</span>
                  <img
                    src={pendingMedia.url}
                    alt="Preview"
                    className="max-h-28 w-auto rounded-md object-cover"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Video will be sent</span>
                  <video
                    src={pendingMedia.url}
                    controls
                    className="max-h-28 w-auto rounded-md"
                  />
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start text-[11px] px-2 py-1"
                onClick={() => setPendingMedia(null)}
              >
                Remove
              </Button>
            </div>
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              <ImageIcon className="h-5 w-5 text-green-600" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => videoInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              <VideoIcon className="h-5 w-5 text-green-600" />
            </Button>
          </div>
          <textarea
            value={value}
            onChange={event => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-2xl border bg-transparent px-4 py-2 text-sm shadow-sm focus-visible:border-primary",
              (disabled || uploading) && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled || uploading}
          />
          <Button
            type="button"
            size="icon"
            className="rounded-full"
            onClick={handleSend}
            disabled={disabled || uploading || (!value.trim() && !pendingMedia)}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

