"use client"
import {ThemeProvider as NextThemesProvider, ThemeProviderProps} from "next-themes"
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
              <div className={containerClassName}>{children}</div>
            </NotificationProvider>
            </SocketProvider>
            {/* footer component -> homework */}
        </NextThemesProvider>
    )
}
