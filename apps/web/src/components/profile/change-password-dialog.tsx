"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"

type Step = "form" | "otp"

function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message: unknown }).message
    if (typeof msg === "string") return msg
    if (Array.isArray(msg)) return msg.join(", ")
  }
  return fallback
}

type ChangePasswordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const [step, setStep] = useState<Step>("form")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep("form")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setOtp("")
  }, [open])

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match")
      return
    }
    if (currentPassword === newPassword) {
      toast.error("New password cannot be the same as the current password")
      return
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters")
      return
    }

    setIsPending(true)
    try {
      const res = await authFetch("/auth/change-password/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(errorMessage(data, "Failed to send OTP"))
        return
      }
      toast.success("OTP sent to your email")
      setStep("otp")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsPending(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.trim().length !== 6) {
      toast.error("Enter the 6-digit code from your email")
      return
    }

    setIsPending(true)
    try {
      const res = await authFetch("/auth/change-password/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ otp: otp.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(errorMessage(data, "Failed to change password"))
        return
      }
      toast.success("Password changed successfully")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "form" ? "Change password" : "Verify email code"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <form onSubmit={(e) => void handleRequest(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cp-current">Current password</Label>
              <Input
                id="cp-current"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isPending}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-new">New password</Label>
              <Input
                id="cp-new"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isPending}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-confirm">Confirm new password</Label>
              <Input
                id="cp-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending}
                required
                minLength={6}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We will email a 6-digit code before changing your password.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Sending…" : "Send OTP"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => void handleConfirm(e)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to your email. Valid for 10 minutes.
            </p>
            <div className="space-y-2">
              <Label htmlFor="cp-otp">Verification code</Label>
              <Input
                id="cp-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                disabled={isPending}
                required
                maxLength={6}
                placeholder="••••••"
                className="tracking-[0.4em] text-center text-lg"
              />
            </div>
            <div className="flex justify-between gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("form")}
                disabled={isPending}
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || otp.length !== 6}>
                  {isPending ? "Verifying…" : "Confirm"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
