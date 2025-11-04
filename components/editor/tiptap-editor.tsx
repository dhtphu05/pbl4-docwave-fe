"use client";

import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react"
import { yUndoPlugin } from "y-prosemirror"
import { WebsocketProvider } from "y-websocket"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
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
import { lowlight } from "@/lib/lowlight" // Đảm bảo đường dẫn này đúng
import { cn } from "@/lib/utils" // Đảm bảo đường dẫn này đúng
import { Button } from "@/components/ui/button" // Đảm bảo đường dẫn này đúng
import { Bold, Italic, Underline as UnderlineIcon, Code, Link2 } from "lucide-react"
import type { Editor } from "@tiptap/react"
import { useCollaboration } from "@/components/collaboration-provider" // Đảm bảo đường dẫn này đúng
import type { Doc } from "yjs"


type Props = {
  docId: string
  initialContent?: any
  onSave?: (json: unknown) => void
  onStatusChange?: (status: "saved" | "saving" | "offline") => void
  onEditorReady?: (editor: Editor | null) => void
  className?: string
}

export function TiptapEditor({ docId, initialContent, onSave, onStatusChange, onEditorReady, className }: Props) {
  const { currentUser: user } = useCollaboration()
  const [collabState, setCollabState] = useState<{
    ydoc: Doc
    provider: WebsocketProvider
    undoManager: any // Y.UndoManager
  } | null>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)
 
  useEffect(() => {
    if (!user) {
      setCollabState(null)
      return
    }

    let ydoc: Doc | null = null
    let provider: WebsocketProvider | null = null
    let cancelled = false

    ;(async () => {
      const Y = await import("yjs")
      if (cancelled) {
        return
      }

      ydoc = new Y.Doc()
      // Thay đổi "ws://localhost:3001" thành URL máy chủ websocket của bạn
      provider = new WebsocketProvider("ws://localhost:3001", docId, ydoc)

      // Tạo UndoManager cho Y.Doc
      const undoManager = new Y.UndoManager(ydoc.getXmlFragment("prosemirror"))

      provider.on("status", (event: { status: "connected" | "disconnected" | "connecting" }) => {
        if (event.status === "connected") {
          onStatusChange?.("saved")
        } else {
          onStatusChange?.("offline")
        }
      })

      provider.awareness.setLocalStateField("user", user)

      setCollabState({ ydoc, provider, undoManager })
    })()

    return () => {
      cancelled = true
      provider?.destroy()
      ydoc?.destroy()
      setCollabState(null)
    }
  }, [docId, user, onStatusChange])

  // --- SỬA LỖI TẠI ĐÂY ---
  const editorOptions = useMemo(() => {
    // Luôn trả về một đối tượng cấu hình hợp lệ
    return {
      content: initialContent,
      onUpdate: ({ editor }: { editor: Editor }) => {
        if (onSave) {
          onStatusChange?.("saving")
          if (saveTimeout.current) {
            clearTimeout(saveTimeout.current)
          }
          saveTimeout.current = setTimeout(() => {
            onSave(editor.getJSON())
          }, 1000) // Debounce save
        }
      },
      extensions: [
        StarterKit.configure({
          history: false, // Tắt history của StarterKit khi dùng Collaboration
          dropcursor: false,
          gapcursor: false,
        }),
        // Thêm yUndoPlugin để kích hoạt undo/redo của Yjs
        ...(collabState?.undoManager
          ? [yUndoPlugin({ undoManager: collabState.undoManager })]
          : []),
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
        // Chỉ thêm extension collaboration khi collabState đã sẵn sàng
        ...(collabState?.ydoc && collabState?.provider
          ? [
              Collaboration.configure({ document: collabState.ydoc, field: docId }),
              CollaborationCursor.configure({ provider: collabState.provider, user }),
            ]
          : []),
      ],
      editorProps: {
        attributes: {
          class:
            "tiptap focus:outline-none min-h-[60vh] pb-16 selection:bg-primary/20",
        },
      },
      immediatelyRender: false,
    }
    // 'user' cũng là một dependency vì nó được dùng trong CollaborationCursor
  }, [collabState, user, initialContent, onSave, onStatusChange]) // Thêm các props có thể thay đổi

  const editor = useEditor(editorOptions, [docId]) // Chỉ tạo lại editor khi docId thay đổi

  useEffect(() => {
    if (!editor) return
    onEditorReady?.(editor)
    return () => {
      onEditorReady?.(null)
    }
  }, [editor, onEditorReady])

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

  // Trì hoãn render cho đến khi editor sẵn sàng
  if (!editor) {
    return null // Hoặc hiển thị một skeleton loading
  }

  const characterCount = editor?.storage.characterCount?.characters() ?? 0

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
