"use client"

import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/i18n/locale-context"

const STORY_KEYS = ["you", "design", "dev", "travel", "music", "food"] as const

export default function StoriesBar() {
  const { t } = useLocale()

  return (
    <div className="rounded-2xl border bg-card/50 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t("stories.title")}</p>
        <p className="text-xs text-muted-foreground">{t("stories.subtitle")}</p>
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STORY_KEYS.map((key, index) => {
          const label = t(`stories.${key}`)
          const active = index === 0
          return (
            <div key={key} className="flex w-[76px] shrink-0 flex-col items-center gap-2">
              <div
                className={cn(
                  "grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-muted/60 to-muted/20 text-sm font-semibold",
                  active && "from-primary/30 to-primary/10"
                )}
              >
                {label.slice(0, 1).toUpperCase()}
              </div>
              <p className="w-full truncate text-center text-xs text-muted-foreground">{label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
