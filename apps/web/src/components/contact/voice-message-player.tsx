"use client"

import { Mic } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  src: string
  durationSec?: number | null
  className?: string
  isOwn?: boolean
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function VoiceMessagePlayer({ src, durationSec, className, isOwn }: Props) {
  return (
    <div
      className={cn(
        "flex min-w-[200px] max-w-xs items-center gap-2",
        className
      )}
    >
      <Mic
        className={cn(
          "h-4 w-4 shrink-0",
          isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
        )}
      />
      <audio
        src={src}
        controls
        preload="metadata"
        className="h-9 w-full max-w-[220px]"
      />
      {typeof durationSec === "number" && durationSec > 0 ? (
        <span
          className={cn(
            "shrink-0 text-[11px] tabular-nums",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatDuration(durationSec)}
        </span>
      ) : null}
    </div>
  )
}
