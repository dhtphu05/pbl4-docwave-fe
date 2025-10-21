"use client"

import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline, List, Plus, MessageSquare } from "lucide-react"
import { useComments } from "./comments-provider"
import { cn } from "@/lib/utils"

interface MobileToolbarProps {
  className?: string
}

export function MobileToolbar({ className }: MobileToolbarProps) {
  const { suggestionMode, toggleSuggestionMode } = useComments()

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 flex items-center justify-center gap-1 z-50",
        "md:hidden", // Only show on mobile
        className,
      )}
    >
      <Button variant="ghost" size="sm">
        <Bold className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <Italic className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <Underline className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button variant="ghost" size="sm">
        <List className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <Plus className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant={suggestionMode ? "default" : "ghost"}
        size="sm"
        onClick={toggleSuggestionMode}
        className={suggestionMode ? "bg-primary hover:bg-primary/90" : ""}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
    </div>
  )
}
