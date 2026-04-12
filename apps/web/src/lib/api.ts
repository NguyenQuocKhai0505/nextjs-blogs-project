
export function apiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (raw) {
    let base = raw.replace(/\/+$/, "")
    try {
      const u = new URL(base)
      const p = (u.pathname || "").replace(/\/+$/, "") || ""
      if (p === "" || p === "/") {
        base = `${base.replace(/\/+$/, "")}/v1`
      }
    } catch {
      if (!base.endsWith("/v1")) base = `${base}/v1`
    }
    if (typeof window !== "undefined") {
      try {
        const u = new URL(base)
        if (u.port === "3000") {
          console.warn(
            "[api] NEXT_PUBLIC_API_URL points to port 3000 (Next.js). Use the Nest API URL, e.g. http://127.0.0.1:4000/v1 — otherwise you will see errors like \"Cannot POST /v1/ai/chat\"."
          )
        }
      } catch {
        /* ignore */
      }
    }
    return base
  }

  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:4000/v1"
  return ""
}

export function apiUrl(path: string) {
  const base = apiBaseUrl()
  if (!base) return path
  if (!path.startsWith("/")) path = `/${path}`
  return `${base}${path}`
}

export function apiSocketUrl() {
  const base = apiBaseUrl()
  if (!base) return ""
  try {
    const u = new URL(base)
    u.pathname = ""
    u.search = ""
    u.hash = ""
    return u.toString().replace(/\/+$/, "")
  } catch {
    return base.replace(/\/v1\/?$/, "")
  }
}

