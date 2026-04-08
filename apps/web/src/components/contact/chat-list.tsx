"use client"

import { useMemo, useState,useEffect } from "react"
import { ContactSummary } from "./contact-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RefreshCcw, Search, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import {ContactUser} from "./contact-client"
type ChatListProps = {
  contacts: ContactSummary[]
  selectedUserId: string | null
  onSelect: (userId: string) => void
  onRefresh: () => void
  onDeleteConversation?: (conversationId: number) => void
}

export default function ChatList({
  contacts,
  selectedUserId,
  onSelect,
  onRefresh,
  onDeleteConversation,
}: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults,setSearchResults] = useState<ContactUser[]>([])
  const [isSearching,setIsSearching] = useState(false)
  const filteredContacts = useMemo(()=>{
    if(!searchTerm.trim()) return contacts
    const keyword = searchTerm.toLowerCase()
    return contacts.filter(contacts => {
      const name = contacts.otherUser.name?.toLowerCase() ?? ""
      const email = contacts.otherUser.email?.toLocaleLowerCase() ?? ""
      return name.includes(keyword) || email.includes(keyword)
    })
  },[contacts,searchTerm])

  //Search user from API when search term changes 
  useEffect(()=>{
    const searchUser = async () =>{
      if(!searchTerm.trim())
      {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try{
        const res = await fetch(`/api/search-users?q=${encodeURIComponent(searchTerm.trim())}&limit=10`)
        if(res.ok){
          const data = await res.json()
          setSearchResults(data.users || [])
        }
      }catch(error)
      {
        console.error("Failed to search users:",error)
        setIsSearching(false)
      }finally{
        setIsSearching(false)
      }
    }
  },[searchTerm])
  //Combine filtered contacts with search results 
  const displayContacts = useMemo(()=>{
    if(!searchTerm.trim()) return contacts

    const contactIds = new Set(contacts.map(c => c.otherUser.id))
    const newUsersFromSearch = searchResults
      .filter(user => !contactIds.has(user.id)) //loai bo user da co trong contacts
      .map(user => ({
        id:-1,
        otherUser: user,
        updatedAt: new Date().toISOString(),
        lastMessage: null,
        unreadCount: 0,
      }))
      return [...filteredContacts,...newUsersFromSearch]
  },[filteredContacts,searchResults,searchTerm])
  return (
    <aside className="border-r bg-muted/40 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            Contacts
          </p>
          <p className="text-2xl font-bold">{contacts.length}</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onRefresh}>
          <RefreshCcw className="size-4" />
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          className="pl-9"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
        />
      </div>

      <div className="flex h-[calc(100%-120px)] flex-col gap-1 overflow-y-auto pr-2">
        {filteredContacts.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No contacts found</p>
        )}
        {displayContacts.map(contact => {
          const key =
            contact.id && contact.id > 0
              ? `conv-${contact.id}`
              : `user-${contact.otherUser.id}`

          return (
            <div key={key} className="flex items-center gap-1">
              <button
                onClick={() => onSelect(contact.otherUser.id)}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                  selectedUserId === contact.otherUser.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
                type="button"
              >
                <Avatar className="size-10">
                  {contact.otherUser.avatar ? (
                    <AvatarImage src={contact.otherUser.avatar} alt={contact.otherUser.name} />
                  ) : null}
                  <AvatarFallback>
                    {contact.otherUser.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-semibold">{contact.otherUser.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {contact.lastMessage?.content ?? "Say hi 👋"}
                  </p>
                </div>
                {contact.unreadCount ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                    {contact.unreadCount}
                  </span>
                ) : null}
              </button>
              {contact.id > 0 && onDeleteConversation && (
                <button
                  type="button"
                  className="rounded-full p-1 hover:bg-background"
                  onClick={e => {
                    e.stopPropagation()
                    onDeleteConversation(contact.id)
                  }}
                  aria-label="Conversation options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

