"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import UserMenu from "../auth/user-menu"
import ThemeToggle from "../theme/theme-toggle"
import { SearchInput } from "../search/search-input"


function Header(){
    const {data:session,isPending} = useSession()
    const router = useRouter()
    
    const navItems =[{
        label:"Create Post", href:"/post/create",
    },{
        label:"About", href:"/about",
    },{
        label:"Contact", href:"/contact",
    }]
    return(
       <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 h-20 md:h-24 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="heart-mask relative h-20 w-20 md:h-24 md:w-24 border-2 border-white/40 shadow-xl shadow-primary/40 transition-transform duration-500 group-hover:scale-110 animate-pulse overflow-hidden translate-y-1 md:translate-y-2">
                        <Image
                            src="/logo.png"
                            alt="Social Website Logo"
                            fill
                            priority
                            className="object-cover"
                        />
                    </div>
                </Link>
                <nav className="hidden md:flex items-center gap-6">
                    {
                        navItems.map((item)=>(
                            <Link href={item.href} key={item.href} 
                            className="text-sm font-medium transition-colors hover:text-primary">
                                {item.label}</Link>
                        ))
                    }
                </nav>
            </div>
            <div className="flex items-center gap-4">
                    <div className="hidden md:block">
                        <SearchInput/>
                    </div>
                    <ThemeToggle/>
                    <div className="flex items-center gap-2 cursor-pointer ">
                        {
                            isPending ? null : session?.user ?
                            <UserMenu user={session?.user}/> : 
                            <Button variant = {"default"} onClick={() => router.push("/auth")}>
                            Login
                        </Button>
                        }
                    </div>
            </div>
        </div>
       </header>
    )
}
export default Header
