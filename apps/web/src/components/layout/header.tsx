"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import ThemeToggle from "../theme/theme-toggle"
import { SearchInput } from "../search/search-input"
import { NotificationBell } from "../notifications/notification-bell"
import { Suspense, useEffect, useState } from "react"
import { getAccessToken } from "@/lib/token"
import JwtUserMenu from "@/components/auth/jwt-user-menu"
import { useMe } from "@/lib/use-me"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { useLocale } from "@/lib/i18n/locale-context"

function Header() {
  const router = useRouter()
  const { t } = useLocale()
  const [hasToken, setHasToken] = useState(false)
  useEffect(() => {
    setHasToken(!!getAccessToken())
  }, [])
  const { me } = useMe(hasToken)

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-2 ring-primary/20 transition-transform duration-200 group-hover:scale-[1.04] sm:h-10 sm:w-10">
            <Image src="/logo.png" alt="Ksocial" fill priority className="object-cover" />
          </div>
          <span className="ks-brand-text hidden text-xl sm:inline">Ksocial</span>
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center px-2 sm:flex md:max-w-sm lg:max-w-md">
          <Suspense
            fallback={<div className="h-10 w-full max-w-md animate-pulse rounded-full bg-muted" />}
          >
            <SearchInput placeholder={t("header.searchPlaceholder")} />
          </Suspense>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <NotificationBell />
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
          {hasToken ? (
            <JwtUserMenu
              avatarUrl={me?.avatarUrl}
              displayName={me?.name ?? t("header.userFallback")}
              role={me?.role ?? null}
            />
          ) : (
            <Button
              variant="default"
              size="sm"
              className="rounded-full px-4"
              onClick={() => router.push("/auth")}
            >
              {t("header.login")}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
