"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import ThemeToggle from "../theme/theme-toggle"
import { SearchInput } from "../search/search-input"
import { NotificationBell } from "../notifications/notification-bell"
import { useEffect, useState } from "react"
import { getAccessToken } from "@/lib/token"
import JwtUserMenu from "@/components/auth/jwt-user-menu"
import { useMe } from "@/lib/use-me"

function Header(){
    const router = useRouter()
    const [hasToken, setHasToken] = useState(false)
    useEffect(() => {
      setHasToken(!!getAccessToken())
    }, [])
    const { me } = useMe(hasToken)
    
    const navItems =[{
        label:"Create Post", href:"/post/create",
    },{
        label:"Chat", href:"/contact",
    },{
        label:"About Author", href:"/about",
    }]
    return(
       <header className="sticky top-0 z-30 border-b bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative h-10 w-10 rounded-2xl border border-primary/20 bg-background/70 shadow-sm transition-transform duration-300 group-hover:scale-[1.03] overflow-hidden">
                        <Image
                            src="/logo.png"
                            alt="Social Website Logo"
                            fill
                            priority
                            className="object-cover"
                        />
                    </div>
                </Link>
                <nav className="hidden md:flex items-center gap-1">
                    {
                        navItems.map((item)=>(
                            <Link href={item.href} key={item.href} 
                            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                                {item.label}</Link>
                        ))
                    }
                </nav>
            </div>
            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                    <div className="hidden md:block">
                        <NotificationBell/>
                    </div>
                {/*Search Box  */}
                    <div className="hidden md:block">
                        <SearchInput/>
                    </div>
                    <ThemeToggle/>
                    <div className="flex items-center gap-2 cursor-pointer ">
                        {
                            hasToken ? (
                              <JwtUserMenu
                                avatarUrl={me?.avatarUrl}
                                displayName={me?.name ?? "User"}
                              />
                            ) : (
                              <Button
                                variant={"default"}
                                className="rounded-xl"
                                onClick={() => router.push("/auth")}
                              >
                                Login
                              </Button>
                            )
                        }
                    </div>
            </div>
        </div>
       </header>
    )
}
export default Header
