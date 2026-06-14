"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Send, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type ChatRole = "user" | "assistant"

type ChatLine = { role: ChatRole; content: string }

export function AiChatWidget() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  /** Only user/assistant turns sent to the API (no synthetic “welcome” row). */
  const [messages, setMessages] = useState<ChatLine[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, open, scrollToBottom])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    if (!getAccessToken()) {
      toast.error("Please sign in to use the assistant.")
      router.push("/auth")
      return
    }

    const nextUser: ChatLine = { role: "user", content: text }
    const history = [...messages, nextUser]
    setMessages(history)
    setInput("")
    setLoading(true)

    try {
      const res = await authFetch("/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (res.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.")
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string }
        toast.error(err?.message ?? "Assistant could not reply. Try again.")
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      const data = (await res.json()) as { text?: string }
      const reply = typeof data.text === "string" ? data.text : ""
      if (!reply) {
        toast.error("Empty response from assistant.")
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }])
    } catch {
      toast.error("Network error. Check your connection.")
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          aria-label="Open AI assistant"
          onClick={() => setOpen(true)}
          className={cn(
            "ks-ai-float fixed z-40 flex h-14 w-14 items-center justify-center rounded-full",
            "border border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-primary/25",
            "ring-2 ring-background transition hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "bottom-24 right-4 md:bottom-6 md:right-6"
          )}
        >
          <Sparkles className="h-7 w-7" aria-hidden />
        </button>
      ) : null}

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close assistant overlay"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
            onClick={() => setOpen(false)}
          />

          <div
            className={cn(
              "fixed z-50 flex max-h-[min(560px,78dvh)] w-[min(100vw-16px,400px)] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl ring-1 ring-border/60",
              "bottom-24 right-3 max-md:left-3 max-md:right-3 max-md:w-auto md:bottom-6 md:right-6"
            )}
            role="dialog"
            aria-label="AI assistant"
          >
            <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Assistant</p>
                  <p className="truncate text-xs text-muted-foreground">Powered by Gemini</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div
              ref={listRef}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 text-sm"
            >
              {messages.length === 0 ? (
                <div className="mr-auto max-w-[92%] rounded-2xl border bg-muted/50 px-3 py-2 leading-relaxed text-foreground">
                  Hi! I’m your in-app assistant. Ask me anything about your studies, coding, or ideas
                  for posts.
                </div>
              ) : null}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3 py-2 leading-relaxed",
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto border bg-muted/50 text-foreground"
                  )}
                >
                  {m.content}
                </div>
              ))}
              {loading ? (
                <div className="mr-auto flex items-center gap-2 rounded-2xl border bg-muted/50 px-3 py-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              ) : null}
            </div>

            <div className="border-t p-2">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Message…"
                  rows={2}
                  disabled={loading}
                  className={cn(
                    "placeholder:text-muted-foreground min-h-[44px] flex-1 resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    "disabled:opacity-50"
                  )}
                />
                <Button
                  type="button"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl"
                  disabled={loading || !input.trim()}
                  aria-label="Send"
                  onClick={() => void send()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
