"use client"

import { useState } from "react"
import { Flag } from "lucide-react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import { useLocale } from "@/lib/i18n/locale-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const REASONS = [
  "SPAM",
  "HARASSMENT",
  "HATE_SPEECH",
  "VIOLENCE",
  "NUDITY",
  "OTHER",
] as const

type ReportReason = (typeof REASONS)[number]

type Props = {
  targetKind: "POST" | "COMMENT" | "USER" | "REEL"
  targetId: string | number
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthRequired?: () => void
}

export function ReportDialog({
  targetKind,
  targetId,
  open,
  onOpenChange,
  onAuthRequired,
}: Props) {
  const { t } = useLocale()
  const [reason, setReason] = useState<ReportReason>("SPAM")
  const [details, setDetails] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!getAccessToken()) {
      onAuthRequired?.()
      return
    }
    setBusy(true)
    try {
      const res = await authFetch("/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetKind,
          targetId: String(targetId),
          reason,
          details: details.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null
        throw new Error(err?.message ?? "fail")
      }
      toast.success(t("report.submitted"))
      setDetails("")
      setReason("SPAM")
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("report.submitFail"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" />
            {t("report.title")}
          </DialogTitle>
          <DialogDescription>{t("report.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="report-reason">{t("report.reasonLabel")}</Label>
            <select
              id="report-reason"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={reason}
              disabled={busy}
              onChange={(e) => setReason(e.target.value as ReportReason)}
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {t(`report.reasons.${r}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details">{t("report.detailsLabel")}</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t("report.detailsPlaceholder")}
              disabled={busy}
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {t("report.cancel")}
          </Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={() => void submit()}>
            {busy ? t("report.submitting") : t("report.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
