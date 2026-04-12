/**
 * URLs that must not be fetched by Cloudinary (HTML pages, not video files).
 * Same rules as web `parseVideoSource` — keep in sync when adding hosts.
 */
export function isPassthroughEmbedVideoUrl(url: string): boolean {
  const raw = url.trim()
  try {
    const u = new URL(raw)
    const h = u.hostname.replace(/^www\./, "").toLowerCase()

    if (h === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0]
      return Boolean(id && /^[\w-]{6,}$/.test(id))
    }

    if (h === "youtube.com" || h === "m.youtube.com" || h === "music.youtube.com") {
      if (/^\/shorts\/[\w-]{6,}/.test(u.pathname)) return true
      if ((u.pathname === "/watch" || u.pathname.startsWith("/watch/")) && u.searchParams.get("v"))
        return true
      if (/^\/embed\/[\w-]+/.test(u.pathname)) return true
    }

    if (h === "vimeo.com" || h === "player.vimeo.com") {
      return /\/(?:video\/)?\d+/.test(u.pathname)
    }

    return false
  } catch {
    return false
  }
}
