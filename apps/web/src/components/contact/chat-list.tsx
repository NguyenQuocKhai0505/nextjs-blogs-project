"use client"

import { useMemo, useState,useEffect } from "react"
import { ContactSummary } from "./contact-client"
import { useLocale } from "@/lib/i18n/locale-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RefreshCcw, Search, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import {ContactUser} from "./contact-client"
import { authFetch } from "@/lib/auth-fetch"
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
  const { t } = useLocale()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults,setSearchResults] = useState<ContactUser[]>([])
  const [isSearching,setIsSearching] = useState(false)

  /** Legacy list UI is 1:1 only; group chats are handled on the main /contact page. */
  const directOnly = useMemo(
    () => contacts.filter((c): c is ContactSummary & { otherUser: ContactUser } => c.otherUser != null),
    [contacts]
  )

  const filteredContacts = useMemo(()=>{
    if(!searchTerm.trim()) return directOnly
    const keyword = searchTerm.toLowerCase()
    return directOnly.filter((row) => {
      const name = row.otherUser.name?.toLowerCase() ?? ""
      const email = row.otherUser.email?.toLocaleLowerCase() ?? ""
      return name.includes(keyword) || email.includes(keyword)
    })
  },[directOnly,searchTerm])

  // Mutual friends only (same rule as main chat page).
  useEffect(() => {
    const searchUser = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try {
        const res = await authFetch(
          `/me/mutual-friends?q=${encodeURIComponent(searchTerm.trim())}`,
          { cache: "no-store" }
        )
        if (res.ok) {
          const data = (await res.json()) as ContactUser[]
          setSearchResults(Array.isArray(data) ? data : [])
        } else {
          setSearchResults([])
        }
      } catch (error) {
        console.error("Failed to search mutual friends:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }
    void searchUser()
  }, [searchTerm])
  //Combine filtered contacts with search results 
  const displayContacts = useMemo(()=>{
    if(!searchTerm.trim()) return directOnly

    const contactIds = new Set(directOnly.map(c => c.otherUser.id))
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
  },[directOnly, filteredContacts,searchResults,searchTerm])
  return (
    <aside className="border-r bg-muted/40 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            Contacts
          </p>
          <p className="text-2xl font-bold">{directOnly.length}</p>
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
                  {contact.otherUser.avatarUrl || contact.otherUser.avatar ? (
                    <AvatarImage
                      src={contact.otherUser.avatarUrl ?? contact.otherUser.avatar ?? ""}
                      alt={contact.otherUser.name}
                    />
                  ) : null}
                  <AvatarFallback>
                    {contact.otherUser.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-semibold">{contact.otherUser.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {contact.lastMessage?.revokedAt
                      ? t("chat.revokedPreview")
                      : (contact.lastMessage?.content ?? "Say hi 👋")}
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

