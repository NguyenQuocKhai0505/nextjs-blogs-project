"use client"

import { DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuSeparator,DropdownMenuTrigger } from "../ui/dropdown-menu"
import { useState } from "react"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { User } from "better-auth"
import Link from "next/link"
import {  LogOut, PenSquare, User as UserIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"

interface UserMenuProps{
    user: User
}
function UserMenu({user}: UserMenuProps){
    const [isLoading,setIsLoading] = useState(false)
    const router = useRouter()
    const getInitials = (name?: string) =>{
        if(!name) return ""
        return name
        .split(" ")
        .map((n)=>n[0])
        .join("")
        .toUpperCase()
    }
    const handleLogOut = async()=>{
        setIsLoading(true)
        try{
            await signOut()
            toast("You have been logged out successfully")
            router.refresh()
        }catch(e){
            console.log(e)
            toast("Failed to log out! Please try again")
        }finally{
            setIsLoading(false)
        }
    }
    return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant={"ghost"} className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>
                        {getInitials(user?.name) || "User"}
                    </AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-bold">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
            </div>
            <DropdownMenuSeparator/>
            {/* Profile */}
            <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4"/>
                    <span>Profile</span>
                </Link>
            </DropdownMenuItem>
            {/* Create Post */}
            <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/post/create">
                    <PenSquare className="mr-2 h-4 w-4"/>
                    <span>Create Post</span>
                </Link>
            </DropdownMenuItem>
            {/* Log out */}
            <DropdownMenuItem className="cursor-pointer" onClick={handleLogOut} disabled={isLoading}>
                <LogOut className="mr-3 h-4 w-4"/>
                <span>{isLoading ? "logging out..." : "Log out"}</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
    )
}
export default UserMenu