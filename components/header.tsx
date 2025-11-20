"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  className?: string
  variant?: "default" | "editor"
}

export function Header({ className, variant = "default" }: HeaderProps) {
  return (
    <header className={cn(
      "border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <FileText className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-foreground">DocWave</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/documents">
            <Button variant="ghost" size="sm">Tài liệu</Button>
          </Link>
          <Link href="/editor">
            <Button variant="ghost" size="sm">Editor</Button>
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {variant === "editor" && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground">Đã lưu</span>
            </div>
          )}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
