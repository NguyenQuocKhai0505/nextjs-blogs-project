"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"

import en from "@/messages/en.json"
import ko from "@/messages/ko.json"
import vi from "@/messages/vi.json"

export type Locale = "en" | "ko" | "vi"

/** BCP 47 tags for `Date#toLocaleString` / `toLocaleTimeString`. */
export const localeBcp47: Record<Locale, string> = {
  en: "en-US",
  ko: "ko-KR",
  vi: "vi-VN",
}

const STORAGE_KEY = "ksocial-locale"

const catalogs: Record<Locale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  ko: ko as Record<string, unknown>,
  vi: vi as Record<string, unknown>,
}

function lookup(obj: unknown, path: string): string {
  const keys = path.split(".")
  let cur: unknown = obj
  for (const k of keys) {
    if (cur == null || typeof cur !== "object") return path
    cur = (cur as Record<string, unknown>)[k]
  }
  return typeof cur === "string" ? cur : path
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>("en")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
      if (stored === "ko" || stored === "en" || stored === "vi") {
        setLocaleState(stored)
      }
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    document.documentElement.lang = localeBcp47[locale].split("-")[0] ?? "en"
  }, [locale, ready])

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      document.documentElement.lang = localeBcp47[next].split("-")[0] ?? "en"
      router.refresh()
    },
    [router]
  )

  const t = useCallback(
    (key: string) => {
      return lookup(catalogs[locale], key)
    },
    [locale]
  )

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider")
  }
  return ctx
}
