"use client"

import { CardTitle } from "@/components/ui/card"
import { useLocale } from "@/lib/i18n/locale-context"
import { AdminVerifiedBadge } from "@/components/user/admin-verified-badge"

export function ProfileNameWithBadge({
  name,
  role,
}: {
  name: string
  role?: string
}) {
  const { t } = useLocale()
  return (
    <div className="mb-1 flex flex-wrap items-center gap-2">
      <CardTitle className="text-3xl">{name}</CardTitle>
      {role === "ADMIN" ? (
        <AdminVerifiedBadge label={t("user.adminVerified")} className="size-7" />
      ) : null}
    </div>
  )
}
