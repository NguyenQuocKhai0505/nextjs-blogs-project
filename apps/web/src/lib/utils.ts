
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function slugify(text:string):string{
      return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')        // Xóa ký tự đặc biệt
            .replace(/[\s_-]+/g, '-')        // Thay space và _ bằng -
            .replace(/^-+|-+$/g, '')         // Xóa - ở đầu/cuối 
}

export function formatDate(input: Date | string | number | null | undefined): string {
  const date =
    input instanceof Date ? input : input != null ? new Date(input) : new Date(NaN)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

/** Social-style relative time: "2h", "3d", or falls back to short date. */
export function formatRelativeTime(
  input: Date | string | number | null | undefined,
  now = Date.now()
): string {
  const date =
    input instanceof Date ? input : input != null ? new Date(input) : new Date(NaN)
  if (Number.isNaN(date.getTime())) return ""

  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000))
  if (diffSec < 60) return "now"
  const mins = Math.floor(diffSec / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w`

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}