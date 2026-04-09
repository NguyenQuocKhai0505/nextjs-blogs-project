"use client"

import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { clearAccessToken } from "@/lib/token"
import { LogOut, Settings, User as UserIcon } from "lucide-react"

type JwtUserMenuProps = {
  avatarUrl?: string | null
  displayName?: string | null
  role?: "USER" | "ADMIN" | null
}

export default function JwtUserMenu({
  avatarUrl,
  displayName,
  role = null,
}: JwtUserMenuProps) {
  const router = useRouter()
  const initials =
    displayName?.trim()?.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() ??
    "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={"ghost"} className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName ?? "User avatar"} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push("/profile")}
        >
          <UserIcon className="h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        {role === "ADMIN" ? (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/admin/categories")}
          >
            <Settings className="h-4 w-4" />
            <span>Manage categories</span>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={() => {
            clearAccessToken()
            router.refresh()
            router.push("/auth")
          }}
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

