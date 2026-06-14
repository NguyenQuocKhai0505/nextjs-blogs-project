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
      className="inline-flex rounded-2xl border border-border/50 bg-muted/30 p-1 backdrop-blur-sm"
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
              ? "ks-brand-gradient text-primary-foreground shadow-sm shadow-primary/25"
              : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
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
