"use client"

import type { ReactNode } from "react"
import { FeedbackProvider } from "@/components/feedback"
import { LocaleProvider } from "@/lib/i18n/locale-context"
import { ThemeProvider } from "@/lib/theme/theme-context"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </LocaleProvider>
    </ThemeProvider>
  )
}
