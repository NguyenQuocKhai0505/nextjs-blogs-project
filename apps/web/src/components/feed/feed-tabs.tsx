"use client"

import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/i18n/locale-context"
import type { FeedMode } from "@/lib/types/feed"

type Props = {
  mode: FeedMode
  onModeChange: (mode: FeedMode) => void
  disabled?: boolean
}

export function FeedTabs({ mode, onModeChange, disabled }: Props) {
  const { t } = useLocale()

  const tabs: { id: FeedMode; label: string }[] = [
    { id: "forYou", label: t("home.feedForYou") },
    { id: "following", label: t("home.feedFollowing") },
  ]

  return (
    <div
      role="tablist"
      aria-label={t("home.feedTabsAria")}
      className="inline-flex rounded-2xl border border-border/60 bg-muted/40 p-1"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={mode === tab.id}
          disabled={disabled}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium transition-all",
            mode === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
            disabled && "opacity-60"
          )}
          onClick={() => onModeChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
