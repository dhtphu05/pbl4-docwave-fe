"use client"

import type { Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline, List, Plus, MessageSquare } from "lucide-react"
import { useComments } from "./comments-provider"
import { cn } from "@/lib/utils"

interface MobileToolbarProps {
  editor?: Editor | null
  className?: string
}

export function MobileToolbar({ className, editor }: MobileToolbarProps) {
  const { suggestionMode, toggleSuggestionMode } = useComments()

  const run = (callback: (editor: Editor) => void) => {
    if (!editor) return
    callback(editor)
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 flex items-center justify-center gap-1 z-50",
        "md:hidden", // Only show on mobile
        className,
      )}
    >
      <Button
        variant={editor?.isActive("bold") ? "default" : "ghost"}
        size="sm"
        disabled={!editor}
        onClick={() => run((instance) => instance.chain().focus().toggleBold().run())}
        aria-pressed={!!editor?.isActive("bold")}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant={editor?.isActive("italic") ? "default" : "ghost"}
        size="sm"
        disabled={!editor}
        onClick={() => run((instance) => instance.chain().focus().toggleItalic().run())}
        aria-pressed={!!editor?.isActive("italic")}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant={editor?.isActive("underline") ? "default" : "ghost"}
        size="sm"
        disabled={!editor}
        onClick={() => run((instance) => instance.chain().focus().toggleUnderline().run())}
        aria-pressed={!!editor?.isActive("underline")}
      >
        <Underline className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant={editor?.isActive("bulletList") ? "default" : "ghost"}
        size="sm"
        disabled={!editor}
        onClick={() => run((instance) => instance.chain().focus().toggleBulletList().run())}
        aria-pressed={!!editor?.isActive("bulletList")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={!editor}
        onClick={() => run((instance) => instance.chain().focus().insertContent({ type: "paragraph" }).run())}
      >
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
