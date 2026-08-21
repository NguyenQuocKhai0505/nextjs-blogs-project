"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { apiUrl } from "@/lib/api"
import { setAccessToken } from "@/lib/token"
import { Button } from "@/components/ui/button"
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
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-primary/5">
      <div className="border-b border-border bg-gradient-to-br from-primary/15 via-transparent to-transparent px-6 pb-5 pt-8 text-center">
        <Link href="/" className="inline-flex flex-col items-center gap-2">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl ring-2 ring-primary/25">
            <Image src="/logo.png" alt="Ksocial" fill className="object-cover" priority />
          </div>
          <span className="ks-brand-text text-2xl">Ksocial</span>
        </Link>
        <h1 className="mt-4 text-xl font-bold tracking-tight">
          {mode === "login" ? "Welcome back" : "Join Ksocial"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to connect with your community"
            : "Create an account to start sharing"}
        </p>
      </div>

      <div className="space-y-4 px-6 py-6">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-full"
          onClick={loginGoogle}
        >
          Continue with Google
        </Button>

        <div className="relative text-center text-xs text-muted-foreground">
          <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
          <span className="relative bg-card px-3">or</span>
        </div>

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
                className="rounded-xl"
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
              className="rounded-xl"
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
              className="rounded-xl"
              required
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button className="h-11 w-full rounded-full" type="submit" disabled={isLoading}>
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
                  className="font-medium text-primary underline-offset-4 hover:underline"
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
                  className="font-medium text-primary underline-offset-4 hover:underline"
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
      </div>
    </div>
  )
}
