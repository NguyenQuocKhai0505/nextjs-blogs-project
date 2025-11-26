
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getConversations } from "@/lib/db/chat-queries"
import ContactClient from "@/components/contact/contact-client" 

export default async function ContactPage()
{
    const session = await auth.api.getSession({headers: await headers()})
    if(!session?.user) redirect ("/auth")
    
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
}