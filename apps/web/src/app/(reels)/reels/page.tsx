"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useReelsOverlay } from "@/components/reels/reels-overlay-provider"

export default function ReelsPage() {
  const router = useRouter()
  const { openReels } = useReelsOverlay()

  useEffect(() => {
    openReels()
    router.replace("/")
  }, [openReels, router])

  return null
}
