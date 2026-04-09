"use client"

import { useLocale } from "@/lib/i18n/locale-context"

export function ContactLoadingFallback() {
  const { t } = useLocale()
  return (
    <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">
      {t("chat.pageLoading")}
    </div>
  )
}
