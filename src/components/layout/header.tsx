"use client"

import Link from "next/link"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import UserMenu from "../auth/user-menu"
import ThemeToggle from "../theme/theme-toggle"


function Header(){
    const {data:session,isPending} = useSession()
    const router = useRouter()
    
    const navItems =[{
        label:"Home", href:"/",
    },{
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
                        {/* Keep an place holder for searching*/}
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
