"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  FlipHorizontal2,
  Grid3X3,
  Home,
  Users,
  Zap,
  ZapOff,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authFetch } from "@/lib/auth-fetch"
import { useLocale } from "@/lib/i18n/locale-context"
import { getAccessToken } from "@/lib/token"
import { useMe } from "@/lib/use-me"
import { cn } from "@/lib/utils"

type ZoomLevel = 1 | 2
type ViewMode = "camera" | "grid"

type MomentItem = {
  id: number
  imageUrl: string
  caption: string | null
  createdAt: string
  author: { id: string; name: string; avatarUrl: string | null }
  viewed: boolean
}

export function MomentsCamera() {
  const { t } = useLocale()
  const [hasToken, setHasToken] = useState(false)
  const { me } = useMe(hasToken)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<HTMLElement>(null)
  const scrollRootRef = useRef<HTMLDivElement>(null)

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [flashOn, setFlashOn] = useState(false)
  const [zoom, setZoom] = useState<ZoomLevel>(1)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [galleryThumb, setGalleryThumb] = useState<string | null>(null)
  const [friendCount, setFriendCount] = useState<number | null>(null)
  const [capturedFile, setCapturedFile] = useState<Blob | null>(null)
  const [caption, setCaption] = useState("")
  const [sending, setSending] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("camera")
  const [moments, setMoments] = useState<MomentItem[]>([])
  const [feedLoading, setFeedLoading] = useState(false)

  useEffect(() => {
    setHasToken(!!getAccessToken())
  }, [])

  useEffect(() => {
    if (!hasToken) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await authFetch("/me/mutual-friends/status", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as unknown
        if (!cancelled && Array.isArray(data)) setFriendCount(data.length)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hasToken])

  const loadFeed = useCallback(async () => {
    if (!hasToken) {
      setMoments([])
      return
    }
    setFeedLoading(true)
    try {
      const res = await authFetch("/moments/feed", { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as unknown
      if (Array.isArray(data)) setMoments(data as MomentItem[])
    } catch {
      /* ignore */
    } finally {
      setFeedLoading(false)
    }
  }, [hasToken])

  useEffect(() => {
    void loadFeed()
  }, [loadFeed])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraReady(false)
  }, [])

  const startCamera = useCallback(async () => {
    stopCamera()
    setCameraError(null)
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError(t("moments.cameraUnsupported"))
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
        setCameraReady(true)
      }
    } catch {
      setCameraError(t("moments.cameraPermission"))
      setCameraReady(false)
    }
  }, [facingMode, stopCamera, t])

  useEffect(() => {
    if (capturedUrl || viewMode !== "camera") {
      stopCamera()
      return
    }
    void startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera, capturedUrl, viewMode])

  useEffect(() => {
    return () => {
      if (galleryThumb?.startsWith("blob:")) URL.revokeObjectURL(galleryThumb)
      if (capturedUrl?.startsWith("blob:") && capturedUrl !== galleryThumb) {
        URL.revokeObjectURL(capturedUrl)
      }
    }
  }, [galleryThumb, capturedUrl])

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !cameraReady) {
      toast.error(t("moments.cameraNotReady"))
      return
    }
    const w = video.videoWidth || 720
    const h = video.videoHeight || 720
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (facingMode === "user") {
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, w, h)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        setCapturedFile(blob)
        setCapturedUrl((prev) => {
          if (prev?.startsWith("blob:") && prev !== galleryThumb) URL.revokeObjectURL(prev)
          return url
        })
        setGalleryThumb((prev) => {
          if (prev?.startsWith("blob:") && prev !== capturedUrl) URL.revokeObjectURL(prev)
          return url
        })
        stopCamera()
      },
      "image/jpeg",
      0.92
    )
  }

  const retake = () => {
    setCapturedFile(null)
    setCaption("")
    setCapturedUrl((prev) => {
      if (prev?.startsWith("blob:") && prev !== galleryThumb) URL.revokeObjectURL(prev)
      return null
    })
  }

  const onPickGallery = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return
    const url = URL.createObjectURL(file)
    setCapturedFile(file)
    setGalleryThumb((prev) => {
      if (prev?.startsWith("blob:") && prev !== capturedUrl) URL.revokeObjectURL(prev)
      return url
    })
    setCapturedUrl((prev) => {
      if (prev?.startsWith("blob:") && prev !== galleryThumb) URL.revokeObjectURL(prev)
      return url
    })
    stopCamera()
  }

  async function sendMoment() {
    if (!hasToken) {
      toast.error(t("moments.loginRequired"))
      return
    }
    if (!capturedFile) {
      toast.error(t("moments.cameraNotReady"))
      return
    }

    setSending(true)
    try {
      const formData = new FormData()
      formData.append("files", capturedFile, "moment.jpg")

      const uploadRes = await authFetch("/upload", {
        method: "POST",
        body: formData,
      })
      const uploadJson = (await uploadRes.json().catch(() => ({}))) as {
        message?: string
        imageUrls?: string[]
      }
      if (!uploadRes.ok) {
        throw new Error(
          typeof uploadJson.message === "string" ? uploadJson.message : t("moments.sendFail")
        )
      }
      const imageUrl = uploadJson.imageUrls?.[0]
      if (!imageUrl) throw new Error(t("moments.noImageUrl"))

      const trimmedCaption = caption.trim()
      const res = await authFetch("/moments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          ...(trimmedCaption ? { caption: trimmedCaption } : {}),
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null
        throw new Error(
          typeof data?.message === "string" ? data.message : t("moments.sendFail")
        )
      }

      toast.success(t("moments.sent"))
      retake()
      void loadFeed()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("moments.sendFail"))
    } finally {
      setSending(false)
    }
  }

  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const goCamera = () => {
    setViewMode("camera")
    requestAnimationFrame(() => {
      scrollRootRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    })
  }

  const friendsLabel =
    friendCount == null
      ? t("moments.friendsFallback")
      : t("moments.friendsCount").replace("{count}", String(friendCount))

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-black text-white">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onPickGallery(e.target.files?.[0] ?? null)
          e.target.value = ""
        }}
      />

      <header className="absolute inset-x-0 top-0 z-30 flex shrink-0 items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition hover:bg-white/15"
          aria-label={t("moments.backToBlog")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <button
          type="button"
          className="flex max-w-[60%] items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 backdrop-blur-md transition hover:bg-white/15"
          onClick={() => toast.message(t("moments.closeFriendsSoon"))}
        >
          <Users className="h-4 w-4 shrink-0" />
          <span className="truncate text-sm font-medium">{friendsLabel}</span>
        </button>

        <Link
          href="/profile"
          className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-sky-400/40"
          aria-label={t("sidebar.profile")}
        >
          <Avatar className="h-full w-full">
            <AvatarImage src={me?.avatarUrl ?? undefined} alt={me?.name ?? ""} />
            <AvatarFallback className="bg-zinc-700 text-sm text-white">
              {(me?.name ?? "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </header>

      {viewMode === "grid" ? (
        <div className="flex-1 overflow-y-auto px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[calc(4.5rem+env(safe-area-inset-top))]">
          <h2 className="mb-3 px-1 text-sm font-medium text-white/70">{t("moments.gridTitle")}</h2>
          {feedLoading && moments.length === 0 ? (
            <p className="py-16 text-center text-sm text-white/50">{t("moments.feedLoading")}</p>
          ) : moments.length === 0 ? (
            <p className="py-16 text-center text-sm text-white/50">{t("moments.emptyHistory")}</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {moments.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="relative aspect-square overflow-hidden rounded-lg bg-zinc-900"
                  onClick={() => {
                    setViewMode("camera")
                    requestAnimationFrame(() => {
                      document
                        .getElementById(`moment-${m.id}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "center" })
                    })
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.imageUrl} alt="" className="h-full w-full object-cover" />
                  {!m.viewed && m.author.id !== me?.id && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sky-400 ring-2 ring-black" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          ref={scrollRootRef}
          className="flex-1 snap-y snap-mandatory overflow-y-auto scroll-smooth"
        >
          <section className="flex min-h-dvh snap-start flex-col">
            <div className="flex flex-1 flex-col items-center justify-center px-4 pt-[calc(3.5rem+env(safe-area-inset-top))]">
              <div className="relative aspect-[3/4] w-full max-w-[420px] overflow-hidden rounded-[2rem] bg-zinc-900 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
                {capturedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={capturedUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className={cn(
                        "h-full w-full object-cover transition-transform duration-200",
                        facingMode === "user" && zoom === 1 && "scale-x-[-1]",
                        facingMode === "user" && zoom === 2 && "scale-x-[-1.35] scale-y-[1.35]",
                        facingMode === "environment" && zoom === 2 && "scale-[1.35]"
                      )}
                    />
                    {!cameraReady && !cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
                        <Camera className="h-10 w-10 animate-pulse text-white/40" />
                      </div>
                    )}
                    {cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 px-6 text-center">
                        <Camera className="h-10 w-10 text-white/35" />
                        <p className="text-sm text-white/70">{cameraError}</p>
                        <button
                          type="button"
                          onClick={() => void startCamera()}
                          className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/20"
                        >
                          {t("moments.retryCamera")}
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm text-sky-300 underline-offset-2 hover:underline"
                        >
                          {t("moments.pickFromGallery")}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {!capturedUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => setFlashOn((v) => !v)}
                      className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm"
                      aria-label={t("moments.flash")}
                    >
                      {flashOn ? (
                        <Zap className="h-4 w-4 text-sky-300" />
                      ) : (
                        <ZapOff className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
                      className="absolute right-3 top-3 flex h-9 min-w-9 items-center justify-center rounded-full bg-black/35 px-2 text-xs font-semibold backdrop-blur-sm"
                      aria-label={t("moments.zoom")}
                    >
                      {zoom}x
                    </button>
                  </>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-4 pb-4 pt-12">
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value.slice(0, 300))}
                    maxLength={300}
                    placeholder={t("moments.captionPlaceholder")}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-center text-sm text-white placeholder:text-white/45 outline-none backdrop-blur-md focus:border-sky-400/60"
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 px-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4">
              {capturedUrl ? (
                <div className="mx-auto flex max-w-[420px] items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={retake}
                    disabled={sending}
                    className="rounded-full bg-white/10 px-6 py-3 text-sm font-medium backdrop-blur-md hover:bg-white/15 disabled:opacity-50"
                  >
                    {t("moments.retake")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendMoment()}
                    disabled={sending || !capturedFile}
                    className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 hover:bg-sky-400 disabled:opacity-50"
                  >
                    {sending ? t("moments.sending") : t("moments.send")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mx-auto flex max-w-[420px] items-center justify-between px-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/20 bg-zinc-800"
                      aria-label={t("moments.gallery")}
                    >
                      {galleryThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={galleryThumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="block h-full w-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={capturePhoto}
                      disabled={!cameraReady}
                      className="group relative flex h-[76px] w-[76px] items-center justify-center rounded-full disabled:opacity-40"
                      aria-label={t("moments.shutter")}
                    >
                      <span className="absolute inset-0 rounded-full border-[3px] border-sky-400" />
                      <span className="h-[62px] w-[62px] rounded-full bg-white transition group-active:scale-95" />
                    </button>

                    <button
                      type="button"
                      onClick={flipCamera}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/15"
                      aria-label={t("moments.flip")}
                    >
                      <FlipHorizontal2 className="h-6 w-6" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={scrollToHistory}
                    className="mx-auto mt-5 flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
                  >
                    <span className="relative h-7 w-7 overflow-hidden rounded-md border border-white/15 bg-zinc-800">
                      {moments[0]?.imageUrl || galleryThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={moments[0]?.imageUrl ?? galleryThumb ?? ""}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </span>
                    {t("moments.history")}
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </button>
                </>
              )}
            </div>
          </section>

          <section
            ref={historyRef}
            className="min-h-dvh snap-start px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-8"
          >
            <h2 className="mb-4 text-center text-sm font-medium text-white/70">
              {t("moments.history")}
            </h2>
            {feedLoading && moments.length === 0 ? (
              <p className="py-16 text-center text-sm text-white/50">{t("moments.feedLoading")}</p>
            ) : moments.length === 0 ? (
              <p className="py-16 text-center text-sm text-white/50">{t("moments.emptyHistory")}</p>
            ) : (
              <div className="mx-auto flex max-w-[420px] flex-col gap-8">
                {moments.map((m) => (
                  <article
                    key={m.id}
                    id={`moment-${m.id}`}
                    className="overflow-hidden rounded-[1.75rem] bg-zinc-900 ring-1 ring-white/10"
                  >
                    <div className="relative aspect-[3/4]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.imageUrl} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/55 to-transparent px-3 py-3">
                        <Avatar className="h-8 w-8 ring-2 ring-sky-400/50">
                          <AvatarImage src={m.author.avatarUrl ?? undefined} alt="" />
                          <AvatarFallback className="bg-zinc-700 text-xs">
                            {m.author.name.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm font-medium">{m.author.name}</span>
                      </div>
                      {m.caption ? (
                        <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10 text-center text-sm">
                          {m.caption}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-zinc-900/90 px-2 py-1.5 shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setViewMode((v) => (v === "grid" ? "camera" : "grid"))}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition",
              viewMode === "grid"
                ? "bg-sky-500 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
            aria-label={t("moments.gridView")}
          >
            <Grid3X3 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goCamera}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition",
              viewMode === "camera"
                ? "bg-sky-500/90 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
            aria-label={t("sidebar.home")}
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </nav>
    </div>
  )
}
