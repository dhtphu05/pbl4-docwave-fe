"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
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

export function CollaborationProvider({ children }: CollaborationProviderProps) {
  const [currentUser] = useState<User>({
    id: "user-1",
    name: "You",
    avatar: "/abstract-geometric-shapes.png",
    color: "#8b5cf6",
  })

  const [collaborators, setCollaborators] = useState<User[]>([
    {
      id: "user-2",
      name: "Alice Johnson",
      avatar: "/abstract-geometric-shapes.png",
      color: "#ef4444",
      cursor: { blockId: "2", position: 15 },
    },
    {
      id: "user-3",
      name: "Bob Smith",
      avatar: "/abstract-geometric-shapes.png",
      color: "#10b981",
      selection: { blockId: "3", start: 20, end: 35 },
    },
  ])

  const onlineUsers = [currentUser, ...collaborators]

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

  // Simulate real-time cursor movements
  useEffect(() => {
    const interval = setInterval(() => {
      setCollaborators((prev) =>
        prev.map((user) => {
          if (user.id === "user-2" && user.cursor) {
            return {
              ...user,
              cursor: {
                ...user.cursor,
                position: Math.max(0, user.cursor.position + (Math.random() > 0.5 ? 1 : -1)),
              },
            }
          }
          return user
        }),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <CollaborationContext.Provider
      value={{
        currentUser,
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
