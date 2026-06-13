"use client"

import { useState } from "react"
import { Languages, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import { cn } from "@/lib/utils"
import { useLocale, type Locale } from "@/lib/i18n/locale-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const TARGET_LANGS: Locale[] = ["en", "ko", "vi"]

type Props = {
  text: string
  align?: "start" | "end"
  onAuthRequired?: () => void
}

export function MessageTranslate({
  text,
  align = "start",
  onAuthRequired,
}: Props) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [translation, setTranslation] = useState<{
    lang: Locale
    text: string
  } | null>(null)

  const translate = async (target: Locale) => {
    if (!getAccessToken()) {
      onAuthRequired?.()
      return
    }
    if (loading) return
    setLoading(true)
    try {
      const res = await authFetch("/ai/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, targetLanguage: target }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null
        throw new Error(err?.message ?? "fail")
      }
      const data = (await res.json()) as { text?: string; targetLanguage?: Locale }
      if (!data.text) throw new Error("empty")
      setTranslation({
        lang: data.targetLanguage ?? target,
        text: data.text,
      })
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("chat.translateFail"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        "max-w-full px-0.5",
        align === "end" ? "text-right" : "text-left"
      )}
    >
      {translation ? (
        <div
          className={cn(
            "mt-1 inline-block max-w-full rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-left",
            align === "end" && "text-right"
          )}
        >
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Languages className="h-3 w-3" />
            {t(`chat.translateLang.${translation.lang}`)}
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-foreground/90">
            {translation.text}
          </p>
          <button
            type="button"
            className="mt-1 text-[11px] text-primary hover:underline"
            onClick={() => {
              setTranslation(null)
              setOpen(true)
            }}
          >
            {t("chat.translateAgain")}
          </button>
        </div>
      ) : (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={loading}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Languages className="h-3 w-3" />
              )}
              {loading ? t("chat.translating") : t("chat.translatePrompt")}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={align === "end" ? "end" : "start"}>
            {TARGET_LANGS.map((lang) => (
              <DropdownMenuItem
                key={lang}
                className="cursor-pointer"
                onClick={() => void translate(lang)}
              >
                {t(`chat.translateLang.${lang}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
