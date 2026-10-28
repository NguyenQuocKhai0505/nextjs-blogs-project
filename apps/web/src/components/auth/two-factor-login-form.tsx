"use client"

import { useState } from "react"

import { apiUrl } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type TwoFactorLoginFormProps = {
  challengeToken: string
  email: string
  onSuccess: (accessToken: string) => void
  onResend: () => Promise<void>
  onBack: () => void
}

export function TwoFactorLoginForm({
  challengeToken,
  email,
  onSuccess,
  onResend,
  onBack,
}: TwoFactorLoginFormProps) {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl("/auth/login/2fa"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeToken, otp }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message
        throw new Error(message ?? "Request failed")
      }
      if (!data?.accessToken) throw new Error("Missing accessToken")
      onSuccess(data.accessToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed")
      setOtp("")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    setIsResending(true)
    setError(null)
    try {
      await onResend()
      setOtp("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <p className="text-sm text-muted-foreground">
        We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
      </p>

      <div className="space-y-2">
        <Label htmlFor="tf-otp">Verification code</Label>
        <Input
          id="tf-otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="rounded-xl text-center tracking-[0.4em]"
          placeholder="••••••"
          required
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        className="h-11 w-full rounded-full"
        type="submit"
        disabled={isLoading || otp.length !== 6}
      >
        {isLoading ? "Verifying..." : "Verify"}
      </Button>

      <button
        type="button"
        className="w-full text-center text-sm text-muted-foreground hover:underline disabled:opacity-50"
        onClick={handleResend}
        disabled={isResending}
      >
        {isResending ? "Sending..." : "Didn't get a code? Send again"}
      </button>

      <div className="text-center text-sm">
        <button
          type="button"
          className="font-medium text-primary underline-offset-4 hover:underline"
          onClick={onBack}
        >
          Back to sign in
        </button>
      </div>
    </form>
  )
}