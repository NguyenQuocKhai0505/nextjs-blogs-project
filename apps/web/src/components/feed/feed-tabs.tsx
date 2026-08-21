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
      className="flex w-full gap-0 border-b border-border"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={mode === tab.id}
          disabled={disabled}
          className={cn(
            "relative flex-1 px-3 py-3 text-sm font-semibold transition-colors",
            mode === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            disabled && "opacity-60"
          )}
          onClick={() => onModeChange(tab.id)}
        >
          {tab.label}
          {mode === tab.id ? (
            <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-primary" />
          ) : null}
        </button>
      ))}
    </div>
  )
}
