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
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <Image
                        src="/logo.png"
                        alt="Social Website Logo"
                        width={200}
                        height={200}
                        priority
                        className="h-14 w-auto md:h-16 rounded-full border-2 border-white/40 shadow-lg shadow-primary/30 transition-transform duration-500 group-hover:scale-110 animate-pulse"
                    />
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
