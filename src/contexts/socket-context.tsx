"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { io, Socket } from "socket.io-client"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let active = true
    let socketInstance: Socket | null = null

    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" })
        if (!res.ok) {
          return null
        }
        const data = await res.json()
        return data?.user ?? null
      } catch (error) {
        console.error("Failed to fetch current user", error)
        return null
      }
    }

    // Chỉ kết nối khi có user đăng nhập
    const initSocket = async () => {
      const currentUser = await fetchCurrentUser()
      if (!currentUser || !active) {
        return // Không kết nối nếu chưa đăng nhập
      }

      // Kết nối Socket.IO
      socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
        path: "/api/socket",
        transports: ["websocket"],
        withCredentials: true,
      })

      socketInstance.on("connect", () => {
        console.log("Socket connected")
        setIsConnected(true)
      })

      socketInstance.on("disconnect", () => {
        console.log("Socket disconnected")
        setIsConnected(false)
      })

      setSocket(socketInstance)
    }

    initSocket()

    return () => {
      active = false
      socketInstance?.close()
      setSocket(null)
      setIsConnected(false)
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}