
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getConversations } from "@/lib/db/chat-queries"
import ContactClient from "@/components/contact/contact-client" 

export default async function ContactPage()
{
    let session = null
    try{
        session = await auth.api.getSession({headers: await headers()})
    }catch(error){
        console.error("[ContactPage] Failed to get session", error)
    }

    if(!session?.user) redirect ("/auth")
    
    try{
        const conversation = await getConversations(session.user.id)
        const serialized = conversation.map(conv => ({
            ...conv,
            updatedAt: conv.updatedAt?.toISOString?.() ?? new Date().toISOString(),
            lastMessage: conv.lastMessage
            ? {
                ...conv.lastMessage,
                createdAt: conv.lastMessage.createdAt?.toISOString?.() ?? "",
            }
            : null
        }))
        return (
            <ContactClient currentUserId ={session.user.id} initialContacts={serialized}/>
        )
    }catch(error){
        console.error("[ContactPage] Failed to load conversations", error)
        redirect("/auth")
    }
}