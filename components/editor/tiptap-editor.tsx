"use client"

import { useEffect, useState, useCallback } from "react"
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"
import StarterKit from "@tiptap/starter-kit" // Make sure this is not a duplicate import
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
import { lowlight } from "@/lib/lowlight"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline as UnderlineIcon, Code, Link2 } from "lucide-react"
import type { Editor } from "@tiptap/react"
import { useCollaboration } from "@/components/collaboration-provider" // Giả sử bạn có provider này để lấy thông tin user

type Props = {
  docId: string
  onEditorReady?: (editor: Editor | null) => void
  className?: string
}

export function TiptapEditor({ docId, onEditorReady, className }: Props) {
  // Lấy thông tin người dùng hiện tại (ví dụ)
  // Bạn cần thay thế bằng logic lấy thông tin người dùng thực tế của mình
  const { currentUser: user } = useCollaboration()

  const editor = useEditor(
    {
      extensions: [
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
      editorProps: {
        attributes: {
          class: "tiptap focus:outline-none min-h-[60vh] pb-16 selection:bg-primary/20",
        },
      },
    },
    [user] // Chỉ phụ thuộc vào user ban đầu
  )

  useEffect(() => {
    if (!editor || !user) {
      return
    }

    // Khởi tạo YDoc và Provider ở đây, sau khi editor đã tồn tại
    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider("ws://localhost:3001", docId, ydoc)

    // Cập nhật các extension với document và provider đã được tạo
    editor.extensionManager.extensions.find((e) => e.name === "collaboration")?.options.document = ydoc
    editor.extensionManager.extensions.find((e) => e.name === "collaborationCursor")?.options.provider = provider

    // Thiết lập awareness state
    provider.awareness.setLocalStateField("user", user)

    // Thêm các extension cộng tác vào editor
    editor.registerPlugin(
      Collaboration.configure({
        document: ydoc,
      }).createProseMirrorPlugin(editor.schema)
    )
    editor.registerPlugin(
      CollaborationCursor.configure({
        provider: provider,
        user: user,
      }).createProseMirrorPlugin(editor.schema)
    )

    return () => {
      provider.disconnect()
      ydoc.destroy()
    }
  }, [editor, docId, user])

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

  // Trì hoãn render cho đến khi editor và provider sẵn sàng
  if (!editor) {
    return null
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
