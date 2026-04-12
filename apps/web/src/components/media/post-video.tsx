"use client"

import { cn } from "@/lib/utils"
import { parseVideoSource } from "@/lib/embed-video"

function youtubeEmbedUrl(videoId: string): string {
  const q = new URLSearchParams({
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3",
    playsinline: "1",
  })
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${q}`
}

function vimeoEmbedUrl(videoId: string): string {
  const q = new URLSearchParams({
    title: "0",
    byline: "0",
    portrait: "0",
    badge: "0",
  })
  return `https://player.vimeo.com/video/${encodeURIComponent(videoId)}?${q}`
}

type PostVideoProps = {
  src: string
  className?: string
  /** e.g. aspect-video w-full max-h-[70vh] */
  frameClassName?: string
  /** Only applies to direct file URLs (`<video>`). */
  muted?: boolean
}

export function PostVideo({ src, className, frameClassName, muted }: PostVideoProps) {
  const parsed = parseVideoSource(src)

  if (parsed.type === "youtube") {
    return (
      <div className={cn("relative w-full overflow-hidden", frameClassName, className)}>
        <iframe
          src={youtubeEmbedUrl(parsed.id)}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          title="YouTube video"
        />
      </div>
    )
  }

  if (parsed.type === "vimeo") {
    return (
      <div className={cn("relative w-full overflow-hidden", frameClassName, className)}>
        <iframe
          src={vimeoEmbedUrl(parsed.id)}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title="Vimeo video"
        />
      </div>
    )
  }

  return (
    <video
      src={parsed.href}
      controls
      playsInline
      muted={muted}
      className={cn(frameClassName, className)}
    />
  )
}
