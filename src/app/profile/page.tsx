
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getPostByUserId } from "@/lib/db/queries"
import PostList from "@/components/post/post-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PenSquare } from "lucide-react"

export default async function ProfilePage(){
    //Kiem tra session - user phai dang nhap
    const session = await auth.api.getSession({
        headers: await headers()
    })

    //Neu chua dang nhap redirect ve homepage
    if(!session || !session.user){
        redirect("/")
    }
    //Lay thong tin
}