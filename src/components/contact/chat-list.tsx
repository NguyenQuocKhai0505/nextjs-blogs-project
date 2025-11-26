"use client"

import { useMemo, useState } from "react"
import { ContactSummary } from "./contact-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RefreshCcw, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type ChatListProps = {
  contacts: ContactSummary[]
  selectedUserId: string | null
  onSelect: (userId: string) => void
  onRefresh: () => void
}

export default function ChatList({
  contacts,
  selectedUserId,
  onSelect,
  onRefresh,
}: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts
    const keyword = searchTerm.toLowerCase()
    return contacts.filter(contact => {
      const name = contact.otherUser.name?.toLowerCase() ?? ""
      const email = contact.otherUser.email?.toLowerCase() ?? ""
      return name.includes(keyword) || email.includes(keyword)
    })
  }, [contacts, searchTerm])

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
        {filteredContacts.map(contact => (
          <button
            key={contact.otherUser.id}
            onClick={() => onSelect(contact.otherUser.id)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-left transition",
              selectedUserId === contact.otherUser.id
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            )}
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
        ))}
      </div>
    </aside>
  )
}

