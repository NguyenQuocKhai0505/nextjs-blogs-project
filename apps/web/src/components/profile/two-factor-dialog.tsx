"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { authFetch } from "@/lib/auth-fetch"

type TwoFactorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = "status" | "code"

function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message: unknown }).message
    if (typeof msg === "string") return msg
    if (Array.isArray(msg)) return msg.join(", ")
  }
  return fallback
}

export function TwoFactorDialog({ open, onOpenChange }: TwoFactorDialogProps) {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [step, setStep] = useState<Step>("status")
  const [sentTo, setSentTo] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch("/me", { cache: "no-store" })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(errorMessage(data, "Failed to load security settings"))
        return
      }
      setEnabled(Boolean((data as { twoFactorEnabled?: boolean }).twoFactorEnabled))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setStep("status")
    setOtp("")
    setError(null)
    void loadStatus()
  }, [open, loadStatus])

  const action = enabled ? "disable" : "enable"

  const requestCode = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await authFetch(`/auth/2fa/${action}/request`, { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(errorMessage(data, "Failed to send code"))
        return
      }
      setSentTo((data as { email?: string })?.email ?? "your email")
      setOtp("")
      setStep("code")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await authFetch(`/auth/2fa/${action}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ otp }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(errorMessage(data, "Invalid or expired code"))
        setOtp("")
        return
      }
      const nowEnabled = Boolean((data as { twoFactorEnabled?: boolean }).twoFactorEnabled)
      setEnabled(nowEnabled)
      setStep("status")
      setOtp("")
      toast.success(
        nowEnabled ? "Two-factor authentication enabled" : "Two-factor authentication disabled"
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const errorBox = error ? (
    <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </p>
  ) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Two-factor authentication</DialogTitle>
          <DialogDescription>
            When enabled, signing in with your password also requires a 6-digit code sent to
            your email.
          </DialogDescription>
        </DialogHeader>

        {loading && enabled === null ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : step === "status" ? (
          <div className="space-y-4">
            {enabled !== null ? (
              <div className="flex items-center gap-3 rounded-xl border p-3">
                <div
                  className={
                    enabled
                      ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  }
                >
                  {enabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{enabled ? "Enabled" : "Disabled"}</p>
                  <p className="text-xs text-muted-foreground">
                    {enabled
                      ? "Your account is protected with an email code at sign-in."
                      : "Add an extra layer of security to your account."}
                  </p>
                </div>
              </div>
            ) : null}

            {errorBox}

            <div className="flex justify-between gap-2">
              <Button
                type="button"
                variant={enabled ? "destructive" : "default"}
                onClick={() => void requestCode()}
                disabled={submitting || enabled === null}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {enabled ? "Disable 2FA" : "Enable 2FA"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={confirmCode}>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{sentTo}</span>. Enter it to{" "}
              {action} two-factor authentication.
            </p>
            <div className="space-y-2">
              <Label htmlFor="tfa-otp">Verification code</Label>
              <Input
                id="tfa-otp"
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

            {errorBox}

            <Button
              className="h-11 w-full rounded-full"
              type="submit"
              variant={action === "disable" ? "destructive" : "default"}
              disabled={submitting || otp.length !== 6}
            >
              {submitting ? "Verifying..." : action === "disable" ? "Disable 2FA" : "Enable 2FA"}
            </Button>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                className="text-muted-foreground hover:underline disabled:opacity-50"
                onClick={() => void requestCode()}
                disabled={submitting}
              >
                Send a new code
              </button>
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setStep("status")
                  setError(null)
                }}
              >
                Back
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
