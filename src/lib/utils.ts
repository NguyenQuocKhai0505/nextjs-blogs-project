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
