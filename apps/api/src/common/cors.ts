import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface"

function collectAllowedOrigins(): Set<string> {
  const allowed = new Set<string>()
  allowed.add("http://localhost:3000")

  const webUrl = process.env.WEB_URL?.trim()
  if (webUrl) allowed.add(webUrl)

  const extra = process.env.CORS_ORIGINS?.split(",") ?? []
  for (const raw of extra) {
    const o = raw.trim()
    if (o) allowed.add(o)
  }

  return allowed
}

function isVercelPreviewOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname
    return host === "vercel.app" || host.endsWith(".vercel.app")
  } catch {
    return false
  }
}

export function buildCorsOptions(): CorsOptions {
  const allowed = collectAllowedOrigins()

  return {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true)
        return
      }
      if (allowed.has(origin) || isVercelPreviewOrigin(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`CORS blocked origin: ${origin}`), false)
    },
    credentials: true,
  }
}
