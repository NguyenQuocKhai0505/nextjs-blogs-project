"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Video } from "lucide-react"
import { toast } from "sonner"

import { apiUrl } from "@/lib/api"
import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import { useLocale } from "@/lib/i18n/locale-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function ReelCreateForm() {
  const router = useRouter()
  const { t } = useLocale()
  const videoRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState("")
  const [uploading, setUploading] = useState(false)

  async function uploadFile(file: File) {
    const formData = new FormData()
    formData.append("files", file)
    const res = await fetch(apiUrl("/upload"), { method: "POST", body: formData })
    const result = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg =
        typeof result?.message === "string" ? result.message : "Upload failed"
      throw new Error(msg)
    }
    return result as { videoUrls?: string[] }
  }

  async function handleSubmit(file: File) {
    if (!getAccessToken()) {
      toast.message(t("reels.loginRequired"))
      router.push("/auth")
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadFile(file)
      const videoUrl = uploaded.videoUrls?.[0]
      if (!videoUrl) throw new Error(t("reels.noVideoUrl"))

      const body: Record<string, string> = { videoUrl }
      const trimmedCaption = caption.trim()
      if (trimmedCaption) body.caption = trimmedCaption

      const res = await authFetch("/reels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? t("reels.createFail"))
      }

      toast.success(t("reels.created"))
      router.push("/reels")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("reels.createFail"))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/reels" className="text-sm text-white/80 hover:text-white">
          {t("reels.backToFeed")}
        </Link>
        <h1 className="text-lg font-semibold">{t("reels.createTitle")}</h1>
        <span className="w-16" />
      </div>

      <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-white/70">{t("reels.createHint")}</p>

        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleSubmit(file)
          }}
        />

        <Button
          type="button"
          className="h-12 rounded-xl"
          disabled={uploading}
          onClick={() => videoRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Video className="mr-2 h-4 w-4" />
          )}
          {uploading ? t("reels.uploading") : t("reels.chooseVideo")}
        </Button>

        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t("reels.captionPlaceholder")}
          maxLength={500}
          className="min-h-[120px] resize-none border-white/15 bg-black/30 text-white placeholder:text-white/40"
        />
      </div>
    </div>
  )
}
