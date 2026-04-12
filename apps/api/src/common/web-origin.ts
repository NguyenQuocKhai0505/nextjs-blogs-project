/** Normalize WEB_URL so it matches the browser Origin header (no trailing slash). */
export function webOrigin(): string {
  return (process.env.WEB_URL ?? "http://localhost:3000").trim().replace(/\/+$/, "")
}
