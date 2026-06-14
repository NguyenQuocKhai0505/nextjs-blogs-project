"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { X } from "lucide-react"

import { ReelsClient } from "@/components/reels/reels-client"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/i18n/locale-context"

type ReelsOverlayContextValue = {
  open: boolean
  openReels: () => void
  closeReels: () => void
}

const ReelsOverlayContext = createContext<ReelsOverlayContextValue | null>(null)

export function useReelsOverlay() {
  const ctx = useContext(ReelsOverlayContext)
  if (!ctx) {
    throw new Error("useReelsOverlay must be used within ReelsOverlayProvider")
  }
  return ctx
}

function ReelsOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useLocale()

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
        aria-label={t("reels.close")}
      />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden rounded-none border-0 bg-black shadow-2xl md:h-[min(92dvh,900px)] md:rounded-2xl md:border md:border-border/40">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-3 top-3 z-20 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
          onClick={onClose}
          aria-label={t("reels.close")}
        >
          <X className="h-5 w-5" />
        </Button>
        <ReelsClient variant="overlay" onClose={onClose} />
      </div>
    </div>
  )
}

export function ReelsOverlayProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const openReels = useCallback(() => setOpen(true), [])
  const closeReels = useCallback(() => setOpen(false), [])

  return (
    <ReelsOverlayContext.Provider value={{ open, openReels, closeReels }}>
      {children}
      {open ? <ReelsOverlay onClose={closeReels} /> : null}
    </ReelsOverlayContext.Provider>
  )
}
