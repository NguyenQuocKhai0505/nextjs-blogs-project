"use client"

import { cn } from "@/lib/utils"
import { parseVideoSource } from "@/lib/embed-video"

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
          src={`https://www.youtube.com/embed/${encodeURIComponent(parsed.id)}`}
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
          src={`https://player.vimeo.com/video/${encodeURIComponent(parsed.id)}`}
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
