"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { apiUrl } from "@/lib/api"
import { setAccessToken } from "@/lib/token"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = useMemo(() => searchParams.get("next") ?? "/", [searchParams])

  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      const data = ev.data
      if (!data || typeof data !== "object") return
      if (!("type" in data) || !("token" in data)) return
      if ((data as { type: unknown }).type !== "OAUTH_TOKEN") return
      const token = (data as { token: unknown }).token
      if (typeof token !== "string") return

      setAccessToken(token)
      router.replace(nextUrl)
      router.refresh()
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [nextUrl, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register"
      const body =
        mode === "login"
          ? { email, password }
          : { name: name.trim(), email, password }

      const res = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? "Request failed")
      }

      const data = (await res.json()) as { accessToken: string }
      if (!data?.accessToken) throw new Error("Missing accessToken")

      setAccessToken(data.accessToken)
      router.replace(nextUrl)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setIsLoading(false)
    }
  }

  function loginGoogle() {
    const w = 520
    const h = 650
    const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0
    const dualScreenTop = window.screenTop ?? window.screenY ?? 0
    const width = window.innerWidth ?? document.documentElement.clientWidth ?? screen.width
    const height =
      window.innerHeight ?? document.documentElement.clientHeight ?? screen.height
    const left = width / 2 - w / 2 + dualScreenLeft
    const top = height / 2 - h / 2 + dualScreenTop

    window.open(
      apiUrl("/auth/google"),
      "google_oauth",
      `popup=yes,width=${w},height=${h},top=${top},left=${left}`
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          {mode === "login" ? "Sign in" : "Create account"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={loginGoogle}
        >
          Continue with Google
        </Button>

        <div className="text-center text-sm text-muted-foreground">or</div>

        <form className="space-y-3" onSubmit={onSubmit}>
          {mode === "register" ? (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading
              ? mode === "login"
                ? "Signing in..."
                : "Creating..."
              : mode === "login"
                ? "Sign in"
                : "Sign up"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4"
                  onClick={() => {
                    setMode("register")
                    setError(null)
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4"
                  onClick={() => {
                    setMode("login")
                    setError(null)
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}