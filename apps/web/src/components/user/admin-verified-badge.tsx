import { BadgeCheck } from "lucide-react"

import { cn } from "@/lib/utils"

/** Blue check for platform admins (role ADMIN). */
export function AdminVerifiedBadge({
  className,
  label,
}: {
  className?: string
  /** Accessible name, e.g. from i18n */
  label: string
}) {
  return (
    <span className="inline-flex shrink-0" title={label}>
      <BadgeCheck
        className={cn("size-[1.15em] text-sky-500 dark:text-sky-400", className)}
        aria-label={label}
      />
    </span>
  )
}
