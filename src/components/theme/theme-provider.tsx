"use client"
import {ThemeProvider as NextThemesProvider, ThemeProviderProps} from "next-themes"
import Header from "../layout/header"
import {cn} from "@/lib/utils"

interface ExtendedThemeProviderprops extends ThemeProviderProps{
    containerClassName?:string
}

export function ThemeProvider({children,containerClassName,...props}:ExtendedThemeProviderprops)
{
    return(
        <NextThemesProvider {...props}>
            <Header/>
            <main className={cn("container mx-auto px-4",containerClassName)}>
                {children}
            </main>
            {/* footer component -> homework */}
        </NextThemesProvider>
    )
}
