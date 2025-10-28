"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Editor } from "@tiptap/react"
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import Typography from "@tiptap/extension-typography"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import Image from "@tiptap/extension-image"
import CharacterCount from "@tiptap/extension-character-count"
import Dropcursor from "@tiptap/extension-dropcursor"
import Gapcursor from "@tiptap/extension-gapcursor"
import TextStyle from "@tiptap/extension-text-style"
import { lowlight } from "@/lib/lowlight"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline as UnderlineIcon, Code, Link2 } from "lucide-react"

type SyncStatus = "saved" | "saving" | "offline"

const DEFAULT_DOC = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "" }],
    },
  ],
}

type Props = {
  docId: string
  initialContent: unknown
  onSave?: (json: unknown) => Promise<void> | void
  onStatusChange?: (status: SyncStatus) => void
  onEditorReady?: (editor: Editor | null) => void
  className?: string
}

function resolveInitialContent(initialContent: unknown) {
  if (typeof initialContent === "string") {
    const trimmed = initialContent.trim()
    if (!trimmed) return DEFAULT_DOC
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === "object" && parsed.type === "doc") {
        return parsed
      }
      return trimmed
    } catch {
      return trimmed
    }
  }

  if (initialContent && typeof initialContent === "object") {
    return initialContent
  }

  return DEFAULT_DOC
}

const SAVE_DELAY = 700

const getIsOnline = () => {
  if (typeof navigator === "undefined") return true
  return navigator.onLine
}

export function TiptapEditor({ docId, initialContent, onSave, onStatusChange, onEditorReady, className }: Props) {
  const [, setStatus] = useState<SyncStatus>("saved")
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resolvedContent = useMemo(() => resolveInitialContent(initialContent), [initialContent])

  const broadcastStatus = useCallback(
    (next: SyncStatus) => {
      setStatus(next)
      onStatusChange?.(next)
    },
    [onStatusChange],
  )

  const scheduleSave = useCallback(
    (editorInstance: Editor) => {
      if (!onSave) return

      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
      }

      broadcastStatus(getIsOnline() ? "saving" : "offline")

      saveTimer.current = setTimeout(async () => {
        try {
          await onSave(editorInstance.getJSON())
          broadcastStatus(getIsOnline() ? "saved" : "offline")
        } catch (error) {
          console.error("Failed to save document", error)
          broadcastStatus("offline")
        }
      }, SAVE_DELAY)
    },
    [broadcastStatus, onSave],
  )

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          codeBlock: false,
        }),
        TextStyle,
        Underline,
        Link.configure({
          autolink: true,
          linkOnPaste: true,
          openOnClick: false,
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Placeholder.configure({
          placeholder: "Gõ “/” để chèn block…",
        }),
        Color,
        Highlight,
        Typography,
        CodeBlockLowlight.configure({
          lowlight,
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        Image.configure({
          allowBase64: true,
        }),
        CharacterCount,
        Dropcursor,
        Gapcursor,
      ],
      content: resolvedContent,
      editorProps: {
        attributes: {
          class: "tiptap focus:outline-none min-h-[60vh] pb-16 selection:bg-primary/20",
        },
      },
      onUpdate: ({ editor }) => scheduleSave(editor),
    },
    [docId],
  )

  useEffect(() => {
    if (!editor) return
    onEditorReady?.(editor)
    return () => {
      onEditorReady?.(null)
    }
  }, [editor, onEditorReady])

  useEffect(() => {
    const handleOnline = () => {
      broadcastStatus("saved")
    }
    const handleOffline = () => {
      broadcastStatus("offline")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [broadcastStatus])

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
      }
    }
  }, [])

  const characterCount = editor?.storage.characterCount?.characters() ?? 0

  const handleSetLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href as string | undefined
    const url = typeof window !== "undefined" ? window.prompt("Link URL", previousUrl || "") : null

    if (url === null) return
    if (url === "") {
      editor.chain().focus().unsetLink().run()
      return
    }

    editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  return (
    <div className={cn("relative", className)}>
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 150 }}
          className="rounded-md border border-border bg-popover shadow-md p-1 flex gap-1"
        >
          <Button
            variant={editor.isActive("bold") ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("underline") ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("code") ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("link") ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={handleSetLink}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="min-h-[60vh]" />

      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-1 rounded-full border border-border shadow-sm">
        {characterCount.toLocaleString()} characters
      </div>
    </div>
  )
}
