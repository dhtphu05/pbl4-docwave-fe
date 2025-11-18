"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useAuth } from "@/components/auth-provider"
import { GUEST_COLORS, pickColorForId } from "@/lib/auth"

export interface User {
  id: string
  name: string
  avatar: string
  color: string
  cursor?: {
    blockId: string
    position: number
  }
  selection?: {
    blockId: string
    start: number
    end: number
  }
}

interface CollaborationContextType {
  currentUser: User
  collaborators: User[]
  updateCursor: (blockId: string, position: number) => void
  updateSelection: (blockId: string, start: number, end: number) => void
  mentionUser: (userId: string) => void
  onlineUsers: User[]
}

const CollaborationContext = createContext<CollaborationContextType | null>(null)

export function useCollaboration() {
  const context = useContext(CollaborationContext)
  if (!context) {
    throw new Error("useCollaboration must be used within CollaborationProvider")
  }
  return context
}

interface CollaborationProviderProps {
  children: ReactNode
}

const LOCAL_STORAGE_KEY = "docwave-guest-user"

const createGuestUser = (index: number): User => {
  const color = GUEST_COLORS[index % GUEST_COLORS.length]
  return {
    id: `guest-${Date.now()}-${index}`,
    name: `Guest ${index}`,
    avatar: "/abstract-geometric-shapes.png",
    color,
  }
}

const readStoredUser = () => {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function CollaborationProvider({ children }: CollaborationProviderProps) {
  const { user: authUser } = useAuth()
  const [guestUser, setGuestUser] = useState<User>(() => readStoredUser() ?? createGuestUser(1))
  const [collaborators] = useState<User[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = readStoredUser()
    if (stored) {
      setGuestUser(stored)
      return
    }
    const guestCount = Number(window.localStorage.getItem(`${LOCAL_STORAGE_KEY}:count`) ?? "0") + 1
    window.localStorage.setItem(`${LOCAL_STORAGE_KEY}:count`, guestCount.toString())
    const generated = createGuestUser(guestCount)
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(generated))
    setGuestUser(generated)
  }, [])

  const resolvedUser = useMemo<User>(() => {
    if (authUser) {
      return {
        id: authUser.id,
        name: authUser.name,
        avatar: authUser.avatar,
        color: authUser.color ?? pickColorForId(authUser.id),
      }
    }
    return guestUser
  }, [authUser, guestUser])

  const onlineUsers = useMemo(() => [resolvedUser, ...collaborators], [resolvedUser, collaborators])

  const updateCursor = (blockId: string, position: number) => {
    // In a real app, this would send cursor position to other users
    console.log(`Cursor moved to block ${blockId}, position ${position}`)
  }

  const updateSelection = (blockId: string, start: number, end: number) => {
    // In a real app, this would send selection to other users
    console.log(`Selection in block ${blockId}: ${start}-${end}`)
  }

  const mentionUser = (userId: string) => {
    const user = onlineUsers.find((u) => u.id === userId)
    if (user) {
      console.log(`Mentioned user: ${user.name}`)
      // In a real app, this would send a notification
    }
  }

  return (
    <CollaborationContext.Provider
      value={{
        currentUser: resolvedUser,
        collaborators,
        updateCursor,
        updateSelection,
        mentionUser,
        onlineUsers,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  )
}
