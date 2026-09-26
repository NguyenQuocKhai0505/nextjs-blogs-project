"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { PartyPopper } from "lucide-react"

import { Button } from "@/components/ui/button"

type FireworksCelebrationProps = {
  open: boolean
  title: string
  description?: string
  redirectLabel: string
  durationMs?: number
  onFinish: () => void
}

type Rocket = { x: number; y: number; vx: number; vy: number; targetY: number; hue: number }
type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  hue: number
  size: number
}

export function FireworksCelebration({
  open,
  title,
  description,
  redirectLabel,
  durationMs = 10_000,
  onFinish,
}: FireworksCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onFinishRef = useRef(onFinish)
  const totalSeconds = Math.ceil(durationMs / 1000)
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)

  useEffect(() => {
    onFinishRef.current = onFinish
  })

  useEffect(() => {
    if (!open) return
    setSecondsLeft(totalSeconds)
    const startedAt = Date.now()
    const id = window.setInterval(() => {
      const left = Math.max(0, totalSeconds - Math.floor((Date.now() - startedAt) / 1000))
      setSecondsLeft(left)
      if (left === 0) {
        window.clearInterval(id)
        onFinishRef.current()
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [open, totalSeconds])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const rockets: Rocket[] = []
    const sparks: Spark[] = []
    let rafId = 0
    let lastLaunch = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const launch = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      rockets.push({
        x: w * (0.15 + Math.random() * 0.7),
        y: h,
        vx: (Math.random() - 0.5) * 2,
        vy: -(h / 70 + Math.random() * 4),
        targetY: h * (0.12 + Math.random() * 0.35),
        hue: Math.floor(Math.random() * 360),
      })
    }

    const explode = (rocket: Rocket) => {
      const count = 60 + Math.floor(Math.random() * 30)
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        const speed = 1.5 + Math.random() * 4.5
        sparks.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 55 + Math.random() * 35,
          hue: rocket.hue + (Math.random() * 40 - 20),
          size: 1.5 + Math.random() * 1.5,
        })
      }
    }

    const tick = (time: number) => {
      const w = window.innerWidth
      const h = window.innerHeight

      if (time - lastLaunch > 450) {
        launch()
        if (Math.random() < 0.35) launch()
        lastLaunch = time
      }

      ctx.globalCompositeOperation = "destination-out"
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)"
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = "lighter"

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]
        r.x += r.vx
        r.y += r.vy
        r.vy += 0.12
        ctx.fillStyle = `hsl(${r.hue}, 100%, 75%)`
        ctx.beginPath()
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2)
        ctx.fill()
        if (r.y <= r.targetY || r.vy >= 0) {
          explode(r)
          rockets.splice(i, 1)
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.vx *= 0.98
        s.vy = s.vy * 0.98 + 0.06
        s.x += s.vx
        s.y += s.vy
        s.life++
        const alpha = 1 - s.life / s.maxLife
        if (alpha <= 0) {
          sparks.splice(i, 1)
          continue
        }
        ctx.fillStyle = `hsla(${s.hue}, 100%, 62%, ${alpha})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
      }

      rafId = window.requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener("resize", resize)
    rafId = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener("resize", resize)
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-live="polite"
      aria-labelledby="celebration-title"
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card/95 px-6 py-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
          <PartyPopper className="h-8 w-8" />
        </div>
        <h2 id="celebration-title" className="mt-4 text-xl font-bold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}

        <p className="mt-5 text-sm text-muted-foreground">
          Redirecting to {redirectLabel} in{" "}
          <span className="font-semibold text-foreground">{secondsLeft}s</span>
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
            style={{ width: `${(secondsLeft / totalSeconds) * 100}%` }}
          />
        </div>

        <Button className="mt-6 h-11 w-full rounded-full" onClick={() => onFinishRef.current()}>
          Continue now
        </Button>
      </div>
    </div>,
    document.body
  )
}
