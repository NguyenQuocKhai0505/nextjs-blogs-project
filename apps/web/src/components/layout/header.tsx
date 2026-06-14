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

    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">

      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-3 sm:h-16 sm:px-6 lg:px-8">

        <Link href="/" className="group flex shrink-0 items-center gap-2.5">

          <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-primary/25 bg-background/80 shadow-sm shadow-primary/10 ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-[1.03] sm:h-10 sm:w-10 sm:rounded-2xl">

            <Image src="/logo.png" alt="Ksocial" fill priority className="object-cover" />

          </div>

          <span className="ks-brand-text hidden text-lg font-bold tracking-tight sm:inline">

            Ksocial

          </span>

        </Link>



        <div className="hidden min-w-0 flex-1 justify-center px-4 sm:flex md:max-w-md lg:max-w-lg">

          <Suspense

            fallback={<div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-muted" />}

          >

            <SearchInput placeholder={t("header.searchPlaceholder")} />

          </Suspense>

        </div>



        <div className="flex items-center gap-1 sm:gap-2">

          <div className="flex items-center gap-0.5 sm:gap-1">

            <NotificationBell />

            <LanguageSwitcher />

          </div>

          <ThemeToggle />

          <div className="flex cursor-pointer items-center gap-2">

            {hasToken ? (

              <JwtUserMenu

                avatarUrl={me?.avatarUrl}

                displayName={me?.name ?? t("header.userFallback")}

                role={me?.role ?? null}

              />

            ) : (

              <Button variant="default" className="rounded-xl" onClick={() => router.push("/auth")}>

                {t("header.login")}

              </Button>

            )}

          </div>

        </div>

      </div>

    </header>

  )

}

export default Header

