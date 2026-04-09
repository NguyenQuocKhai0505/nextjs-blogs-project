"use client"

import { Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale, type Locale } from "@/lib/i18n/locale-context"
import { cn } from "@/lib/utils"

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  const select = (next: Locale) => {
    if (next !== locale) setLocale(next)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-xl"
          aria-label="Language"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          className={cn(locale === "en" && "bg-accent")}
          onClick={() => select("en")}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          className={cn(locale === "ko" && "bg-accent")}
          onClick={() => select("ko")}
        >
          한국어
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
