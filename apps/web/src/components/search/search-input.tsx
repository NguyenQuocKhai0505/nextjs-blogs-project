"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "../ui/input"
import { Search, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Card } from "../ui/card"

interface SearchUser {
    id:string,
    name: string,
    email: string,
    avatar?: string | null
}

export function SearchInput() {
    const [query,setQuery] = useState("")
    const [results,setResults] = useState<SearchUser[]>([])
    const [loading, setLoading] = useState(false)
    const [showResults,setShowResults] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(()=>{
        const urlQuery = searchParams.get("q")
        if(urlQuery) setQuery(urlQuery)
    },[searchParams])
    
    useEffect(() =>{
        const handleClickOutside = (event: MouseEvent) =>{
            if(searchRef.current && !searchRef.current.contains(event.target as Node)){
                setShowResults(false)
            }
        }
        document.addEventListener("mousedown",handleClickOutside)
        return () => document.removeEventListener("mousedown",handleClickOutside)
    },[])
    
    useEffect(() => {
        if (query.trim().length === 0) {
          setResults([])
          setShowResults(false)
          return
        }
    
        const timeoutId = setTimeout(async () => {
          setLoading(true)
          try {
            const response = await fetch(
              `/api/search-users?q=${encodeURIComponent(query.trim())}&limit=5`
            )
            const data = await response.json()
            if (response.ok && data.success && Array.isArray(data.users)) {
              setResults(data.users)
              setShowResults(true)
            } else {
              setResults([])
              setShowResults(false)
            }
          } catch (err) {
            console.error(err)
          } finally {
            setLoading(false)
          }
        }, 300)
    
        return () => clearTimeout(timeoutId)
      }, [query])
    
    const handleSubmit = (e:React.FormEvent) =>
    {
        e.preventDefault()
        if(query.trim())
        {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`)
            setShowResults(false)
        }
    }
    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0,2)
    return(
        <div className="relative w-full max-w-sm" ref={searchRef}>
            <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search User..."
                className="pl-10 pr-10"
                onFocus={() => query.trim() && setShowResults(true)}/>
                {
                    loading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"/>
                    )
                }
            </form>
            {
                showResults && results.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg">
                        <div className="p-2 space-y-2">
                            {results.map((user)=>(
                                <Link
                                key={user.id}
                                href={`/profile/${user.id}`}
                                onClick={()=>{
                                    setShowResults(false)
                                    setQuery("")
                                }}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                               <Avatar className="h-10 w-10">
                                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{user.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                </div>
                                </Link>
                            ))}
                            {results.length >=5 && (
                                <Link
                                href={`/search?q=${encodeURIComponent(query.trim())}`}
                                onClick={() => setShowResults(false)}
                                className="block p-2 text-center text-sm text-primary hover:underline">
                                    View all results
                                </Link>
                            )}
                        </div>
                    </Card>
                )
            }
        </div>
    )
}