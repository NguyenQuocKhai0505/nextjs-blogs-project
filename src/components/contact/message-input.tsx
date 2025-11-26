"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

type MessageInputProps = {
  onSend: (value: string) => void
  disabled?: boolean
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState("")

  const handleSend = () => {
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue("")
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-3 border-t px-4 py-3">
      <textarea
        value={value}
        onChange={event => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-2xl border bg-transparent px-4 py-2 text-sm shadow-sm focus-visible:border-primary",
          disabled && "cursor-not-allowed opacity-50"
        )}
        disabled={disabled}
      />
      <Button
        type="button"
        size="icon"
        className="rounded-full"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <Send className="size-4" />
      </Button>
    </div>
  )
}

