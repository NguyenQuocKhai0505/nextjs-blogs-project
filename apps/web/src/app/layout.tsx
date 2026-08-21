import type { Metadata } from "next"
import { Suspense } from "react"
import { Outfit, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { LocaleProvider } from "@/lib/i18n/locale-context"
import { Toaster } from "sonner"
import { ReelsOverlayProvider } from "@/components/reels/reels-overlay-provider"

function ReelsOverlayRoot({ children }: { children: React.ReactNode }) {
  return <ReelsOverlayProvider>{children}</ReelsOverlayProvider>
}

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
})

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Ksocial",
  description: "Connect, share, and discover with our community",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} ${outfit.variable} antialiased`}>
        <Suspense fallback={null}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LocaleProvider>
              <ReelsOverlayRoot>{children}</ReelsOverlayRoot>
            </LocaleProvider>
          </ThemeProvider>
        </Suspense>
        <Toaster />
      </body>
    </html>
  )
}
