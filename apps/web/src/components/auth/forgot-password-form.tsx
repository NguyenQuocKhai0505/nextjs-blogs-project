"use client"

import { useState } from "react"

import { apiUrl } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Step = "email" | "reset" | "done"

type ForgotPasswordFormProps = {
  onBackToLogin: () => void
}

async function postJson(path: string, body: unknown) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message
    throw new Error(message ?? "Request failed")
  }
  return data as { message: string }
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function onRequestCode(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const data = await postJson("/auth/forgot-password", { email: email.trim() })
      setInfo(data.message)
      setStep("reset")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setIsLoading(false)
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await postJson("/auth/reset-password", {
        email: email.trim(),
        otp,
        newPassword,
        confirmPassword,
      })
      setStep("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setIsLoading(false)
    }
  }

  const errorBox = error ? (
    <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </p>
  ) : null

  if (step === "done") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Button className="h-11 w-full rounded-full" onClick={onBackToLogin}>
          Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {step === "email" ? (
        <form className="space-y-3" onSubmit={onRequestCode}>
          <div className="space-y-2">
            <Label htmlFor="fp-email">Email</Label>
            <Input
              id="fp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>
          {errorBox}
          <Button className="h-11 w-full rounded-full" type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send code"}
          </Button>
        </form>
      ) : (
        <form className="space-y-3" onSubmit={onResetPassword}>
          {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="fp-otp">Verification code</Label>
            <Input
              id="fp-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="rounded-xl text-center tracking-[0.4em]"
              placeholder="••••••"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fp-new">New password</Label>
            <Input
              id="fp-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-xl"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fp-confirm">Confirm new password</Label>
            <Input
              id="fp-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-xl"
              minLength={6}
              required
            />
          </div>
          {errorBox}
          <Button
            className="h-11 w-full rounded-full"
            type="submit"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:underline"
            onClick={() => {
              setStep("email")
              setError(null)
            }}
          >
            Didn&apos;t get a code? Send again
          </button>
        </form>
      )}

      <div className="text-center text-sm">
        <button
          type="button"
          className="font-medium text-primary underline-offset-4 hover:underline"
          onClick={onBackToLogin}
        >
          Back to sign in
        </button>
      </div>
    </div>
  )
}
