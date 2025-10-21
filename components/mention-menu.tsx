"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCollaboration } from "./collaboration-provider"

interface MentionMenuProps {
  isOpen: boolean
  onClose: () => void
  onMention: (userId: string, userName: string) => void
  position: { x: number; y: number }
  query: string
}

export function MentionMenu({ isOpen, onClose, onMention, position, query }: MentionMenuProps) {
  const { onlineUsers } = useCollaboration()

  if (!isOpen) return null

  const filteredUsers = onlineUsers.filter(
    (user) => user.name.toLowerCase().includes(query.toLowerCase()) && user.id !== "user-1",
  )

  return (
    <div
      className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg p-2 w-64"
      style={{ left: position.x, top: position.y }}
    >
      <div className="text-xs text-muted-foreground mb-2 px-2">People</div>
      {filteredUsers.length === 0 ? (
        <div className="p-2 text-sm text-muted-foreground">No users found</div>
      ) : (
        filteredUsers.map((user) => (
          <button
            key={user.id}
            className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded text-left"
            onClick={() => {
              onMention(user.id, user.name)
              onClose()
            }}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback style={{ backgroundColor: user.color, color: "white" }}>
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{user.name}</div>
            </div>
          </button>
        ))
      )}
    </div>
  )
}
