"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Mic, Send, Square, Video as VideoIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiUrl } from "@/lib/api"
import { useLocale } from "@/lib/i18n/locale-context"
import { useVoiceRecorder } from "@/hooks/use-voice-recorder"
import { toast } from "sonner"

type MessageInputProps = {
  onSend: (payload: {
    content?: string
    imageUrl?: string
    videoUrl?: string
    audioUrl?: string
    audioDurationSec?: number
  }) => void
  disabled?: boolean
}

function PendingImagePreview({ url, className }: { url: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- blob / object URL preview
  return <img src={url} alt="Preview" className={className} />
}

function formatRecordingTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const { t } = useLocale()
  const [value, setValue] = useState("")
  const [pendingMedia, setPendingMedia] = useState<{ type: "image" | "video"; url: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)

  const { isRecording, durationSec, start, stop, cancel } = useVoiceRecorder()

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

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
      const res = await fetch(apiUrl("/upload"), {
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

  const uploadVoiceBlob = async (
    blob: Blob,
    filename: string
  ): Promise<string | null> => {
    const formData = new FormData()
    formData.append("files", blob, filename)
    const res = await fetch(apiUrl("/upload"), {
      method: "POST",
      body: formData,
    })
    if (!res.ok) return null
    const data = (await res.json()) as { audioUrls?: string[] }
    return data.audioUrls?.[0] ?? null
  }

  const handleMicClick = async () => {
    if (disabled || uploading) return

    if (isRecording) {
      setUploading(true)
      try {
        const result = await stop()
        if (!result) return
        const audioUrl = await uploadVoiceBlob(result.blob, result.filename)
        if (!audioUrl) {
          toast.error(t("chat.voiceUploadFail"))
          return
        }
        onSend({
          audioUrl,
          audioDurationSec: result.durationSec,
        })
      } catch {
        toast.error(t("chat.voiceUploadFail"))
      } finally {
        setUploading(false)
      }
      return
    }

    const ok = await start()
    if (!ok) {
      toast.error(t("chat.micPermissionDenied"))
    }
  }

  const handleSend = () => {
    if (disabled || uploading || isRecording) return
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

  const busy = disabled || uploading

  return (
    <div className="flex items-end gap-3 px-2 py-2 sm:px-0 sm:py-3">
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
        {isRecording ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
            <div className="flex items-center gap-2 text-destructive">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
              </span>
              <span className="font-medium">{t("chat.recording")}</span>
              <span className="tabular-nums">{formatRecordingTime(durationSec)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => cancel()}
              >
                <X className="h-3.5 w-3.5" />
                {t("chat.cancelRecording")}
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => void handleMicClick()}
              >
                <Square className="h-3 w-3 fill-current" />
                {t("chat.stopAndSend")}
              </Button>
            </div>
          </div>
        ) : null}

        {pendingMedia && !isRecording ? (
          <div className="rounded-lg border bg-muted px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-start justify-between gap-2">
              {pendingMedia.type === "image" ? (
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{t("chat.inputImagePending")}</span>
                  <PendingImagePreview
                    url={pendingMedia.url}
                    className="max-h-28 w-auto rounded-md object-cover"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{t("chat.inputVideoPending")}</span>
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
                {t("chat.remove")}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => imageInputRef.current?.click()}
              disabled={busy || isRecording}
            >
              <ImageIcon className="h-5 w-5 text-green-600" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => videoInputRef.current?.click()}
              disabled={busy || isRecording}
            >
              <VideoIcon className="h-5 w-5 text-green-600" />
            </Button>
            <Button
              type="button"
              variant={isRecording ? "destructive" : "ghost"}
              size="icon"
              className="rounded-full"
              onClick={() => void handleMicClick()}
              disabled={busy && !isRecording}
              aria-label={isRecording ? t("chat.stopAndSend") : t("chat.recordVoice")}
              title={isRecording ? t("chat.stopAndSend") : t("chat.recordVoice")}
            >
              <Mic className={cn("h-5 w-5", isRecording ? "text-destructive-foreground" : "text-blue-600")} />
            </Button>
          </div>
          <textarea
            value={value}
            onChange={event => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat.inputPlaceholder")}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-2xl border bg-transparent px-4 py-2 text-sm shadow-sm focus-visible:border-primary",
              busy && "cursor-not-allowed opacity-50"
            )}
            disabled={busy || isRecording}
          />
          <Button
            type="button"
            size="icon"
            className="rounded-full"
            onClick={handleSend}
            disabled={busy || isRecording || (!value.trim() && !pendingMedia)}
            aria-label={t("chat.sendAria")}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
