
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