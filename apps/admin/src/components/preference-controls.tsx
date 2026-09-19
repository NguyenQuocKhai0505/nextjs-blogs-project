"use client"

import { Globe, Moon, Sun } from "lucide-react"
import { useLocale, type Locale } from "@/lib/i18n/locale-context"
import { useTheme } from "@/lib/theme/theme-context"
import { cn } from "@/lib/utils"

const LOCALES: { id: Locale; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "vi", label: "VI" },
  { id: "ko", label: "KO" },
]

export function PreferenceControls({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className="flex items-center gap-0.5 rounded-full border border-[var(--admin-border)] bg-[var(--admin-panel-2)] p-0.5"
        role="group"
        aria-label={t("common.language")}
      >
        <Globe className="ml-1.5 h-3.5 w-3.5 text-[var(--admin-muted)]" />
        {LOCALES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLocale(item.id)}
            className={cn(
              "rounded-full px-2 py-1 text-[11px] font-semibold transition",
              locale === item.id
                ? "bg-sky-500 text-slate-950"
                : "text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="grid h-8 w-8 place-items-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-muted)] transition hover:text-[var(--admin-text)]"
        aria-label={t("common.theme")}
        title={theme === "dark" ? t("common.themeLight") : t("common.themeDark")}
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
