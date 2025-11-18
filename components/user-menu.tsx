"use client"

import Link from "next/link"
import { Loader2, LogOut, UserRound } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type UserMenuProps = {
  className?: string
  variant?: "full" | "icon"
}

export function UserMenu({ className, variant = "full" }: UserMenuProps) {
  const { user, status, signOut } = useAuth()

  if (variant === "icon") {
    const isLoading = status === "loading"
    if (!user) {
      return (
        <Button variant="ghost" size="icon" className={className} asChild>
          <Link href="/login">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
          </Link>
        </Button>
      )
    }
    return (
      <Button variant="ghost" size="icon" disabled={isLoading} onClick={signOut} className={className}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      </Button>
    )
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" className={cn("gap-2", className)} asChild>
        <Link href="/login">
          <UserRound className="h-4 w-4" />
          Sign in
        </Link>
      </Button>
    )
  }

  return (
    <div className={cn("flex items-center gap-2 rounded-full border px-2 py-1 bg-background", className)}>
      <Avatar className="h-8 w-8 border border-border">
        <AvatarImage src={user.avatar} />
        <AvatarFallback style={{ backgroundColor: user.color, color: "white" }}>
          {user.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-foreground">{user.name}</span>
        {user.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
      </div>
      <Button variant="ghost" size="icon" onClick={signOut}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
