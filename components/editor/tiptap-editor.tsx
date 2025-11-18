"use client";
import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react"
import { Extension } from "@tiptap/core"
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
import { lowlight } from "@/lib/lowlight"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline as UnderlineIcon, Code, Link2 } from "lucide-react"
import type { Editor } from "@tiptap/react"
import { useCollaboration } from "@/components/collaboration-provider"
import type { Doc } from "yjs"

const Y_WEBSOCKET_URL = process.env.NEXT_PUBLIC_YWS_URL ?? "ws://localhost:3001"
const COLLAB_FRAGMENT = "prosemirror"

type Props = {
  docId: string
  initialContent?: any
  onSave?: (json: unknown) => void
  onStatusChange?: (status: "saved" | "saving" | "offline") => void
  onEditorReady?: (editor: Editor | null) => void
  onPresenceChange?: (users: Array<{ id: string; name: string; avatar?: string; color?: string }>) => void
  className?: string
}

export function TiptapEditor({
  docId,
  initialContent,
  onSave,
  onStatusChange,
  onEditorReady,
  onPresenceChange,
  className
}: Props) {
  const { currentUser: user } = useCollaboration()
  const [collabState, setCollabState] = useState<{
    ydoc: Doc
    provider: WebsocketProvider
    undoManager: any
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

    let awarenessHandler: (() => void) | null = null

    ;(async () => {
      const Y = await import("yjs")
      if (cancelled) {
        return
      }

      ydoc = new Y.Doc()
      provider = new WebsocketProvider(Y_WEBSOCKET_URL, docId, ydoc)

      const undoManager = new Y.UndoManager(ydoc.getXmlFragment(COLLAB_FRAGMENT))

      const emitPresence = () => {
        if (!provider || !onPresenceChange) return
        const states = Array.from(provider.awareness.getStates().values())
        const users = states
          .map((s: any) => s?.user)
          .filter(Boolean)
          .map((u: any) => ({
            id: u.id ?? "",
            name: u.name ?? "Unknown",
            avatar: u.avatar,
            color: u.color,
          }))
        onPresenceChange(users)
      }

      awarenessHandler = emitPresence
      provider.awareness.on("change", awarenessHandler)

      provider.on("status", (event: { status: "connected" | "disconnected" | "connecting" }) => {
        if (event.status === "connected") {
          onStatusChange?.("saved")
          emitPresence()
        } else {
          onStatusChange?.("offline")
        }
      })

      provider.awareness.setLocalStateField("user", user)

      emitPresence()

      setCollabState({ ydoc, provider, undoManager })
    })()

    return () => {
      cancelled = true
      if (provider && awarenessHandler) {
        provider.awareness.off("change", awarenessHandler)
      }
      provider?.destroy()
      ydoc?.destroy()
      setCollabState(null)
      onPresenceChange?.([])
    }
  }, [docId, user, onStatusChange, onPresenceChange])

  const editorOptions = useMemo(() => {
    const undoExtension = collabState?.undoManager
      ? Extension.create({
          name: "yjs-undo",
          addCommands() {
            return {
              undo:
                () =>
                () => {
                  if (!collabState.undoManager) return false
                  collabState.undoManager.undo()
                  return true
                },
              redo:
                () =>
                () => {
                  if (!collabState.undoManager) return false
                  collabState.undoManager.redo()
                  return true
                },
            }
          },
          addKeyboardShortcuts() {
            return {
              "Mod-z": () => this.editor.commands.undo(),
              "Shift-Mod-z": () => this.editor.commands.redo(),
            }
          },
        })
      : null

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
            onStatusChange?.("saved")
          }, 1000)
        }
      },
      extensions: [
        StarterKit.configure({
          history: false,
          dropcursor: false,
          gapcursor: false,
        }),
        ...(undoExtension ? [undoExtension] : []),
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
          placeholder: "Gõ \"/\" để chèn block…",
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
        ...(collabState?.ydoc && collabState?.provider
          ? [
              Collaboration.configure({
                document: collabState.ydoc,
                field: COLLAB_FRAGMENT,
              }),
              CollaborationCursor.configure({
                provider: collabState.provider,
                user,
              }),
            ]
          : []),
      ],
      editorProps: {
        attributes: {
          class: "tiptap focus:outline-none min-h-[60vh] pb-16 selection:bg-primary/20",
        },
      },
      immediatelyRender: false,
    }
  }, [collabState, user, initialContent, onSave, onStatusChange])

  const editor = useEditor(editorOptions, [docId, collabState?.ydoc])

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

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải editor...</div>
      </div>
    )
  }

  const characterCount = editor?.storage.characterCount?.characters() ?? 0

  return (
    <div className={cn("relative", className)}>
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-1 rounded-lg border bg-background p-1 shadow-md"
        >
          <Button
            size="sm"
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive("underline") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive("code") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive("link") ? "secondary" : "ghost"}
            onClick={handleSetLink}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />

      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
        {characterCount.toLocaleString()} characters
      </div>
    </div>
  )
}
