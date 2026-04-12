"use client"

import { useEffect, useMemo } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type LightboxProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: string[]
  index: number
  onIndexChange: (index: number) => void
  className?: string
}

export default function Lightbox({
  open,
  onOpenChange,
  images,
  index,
  onIndexChange,
  className,
}: LightboxProps) {
  const count = images.length
  const safeIndex = useMemo(() => {
    if (count <= 0) return 0
    return Math.min(Math.max(index, 0), count - 1)
  }, [count, index])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        onIndexChange((safeIndex - 1 + count) % count)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        onIndexChange((safeIndex + 1) % count)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, safeIndex, count, onIndexChange])

  const src = images[safeIndex] ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-none border-0 bg-transparent p-0 shadow-none outline-none",
          "w-[min(1100px,calc(100vw-24px))] sm:w-[min(1280px,calc(100vw-48px))]",
          className
        )}
      >
        <div className="relative overflow-hidden rounded-2xl bg-black/90 ring-1 ring-white/10">
          {src ? (
            <div className="relative h-[min(76vh,720px)] w-full">
              <Image
                src={src}
                alt=""
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          ) : (
            <div className="flex h-[min(76vh,720px)] w-full items-center justify-center text-sm text-white/80">
              No image
            </div>
          )}

          {count > 1 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/55"
                onClick={() => onIndexChange((safeIndex - 1 + count) % count)}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/55"
                onClick={() => onIndexChange((safeIndex + 1) % count)}
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white">
                {safeIndex + 1}/{count}
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

