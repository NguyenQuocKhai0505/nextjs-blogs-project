export type ParsedVideo =
  | { type: "youtube"; id: string }
  | { type: "vimeo"; id: string }
  | { type: "direct"; href: string }

/**
 * Detect YouTube (watch, shorts, youtu.be) / Vimeo vs direct video file URL.
 */
export function parseVideoSource(raw: string): ParsedVideo {
  const url = raw.trim()
  try {
    const u = new URL(url)
    const h = u.hostname.replace(/^www\./, "").toLowerCase()

    if (h === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0]
      if (id && /^[\w-]{6,}$/.test(id)) return { type: "youtube", id }
    }

    if (h === "youtube.com" || h === "m.youtube.com" || h === "music.youtube.com") {
      const shorts = u.pathname.match(/^\/shorts\/([\w-]{6,})/)
      if (shorts) return { type: "youtube", id: shorts[1] }

      if (u.pathname === "/watch" || u.pathname.startsWith("/watch/")) {
        const v = u.searchParams.get("v")
        if (v && /^[\w-]{6,}$/.test(v)) return { type: "youtube", id: v }
      }

      const embed = u.pathname.match(/^\/embed\/([\w-]+)/)
      if (embed) return { type: "youtube", id: embed[1] }
    }

    if (h === "vimeo.com" || h === "player.vimeo.com") {
      const m = u.pathname.match(/\/(?:video\/)?(\d+)/)
      if (m) return { type: "vimeo", id: m[1] }
    }

    return { type: "direct", href: url }
  } catch {
    return { type: "direct", href: url }
  }
}

export function isEmbedProviderUrl(url: string): boolean {
  const p = parseVideoSource(url)
  return p.type === "youtube" || p.type === "vimeo"
}
