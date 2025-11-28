"use client"
import {ThemeProvider as NextThemesProvider, ThemeProviderProps} from "next-themes"
import Header from "../layout/header"
import {cn} from "@/lib/utils"
import { SocketProvider } from "@/contexts/socket-context"
import { NotificationProvider } from "@/contexts/notification-context"

interface ExtendedThemeProviderprops extends ThemeProviderProps{
    containerClassName?:string
}

export function ThemeProvider({children,containerClassName,...props}:ExtendedThemeProviderprops)
{
    return(
        <NextThemesProvider {...props}>
            <SocketProvider>
            <NotificationProvider>
            <Header/>
            <main className={cn("container mx-auto px-4",containerClassName)}>
                {children}
            </main>
            </NotificationProvider>
            </SocketProvider>
            {/* footer component -> homework */}
        </NextThemesProvider>
    )
}
