"use client"

import type React from "react"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Minus,
  Copy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCollaboration } from "./collaboration-provider"
import { UserCursor } from "./user-cursor"
import { UserSelection } from "./user-selection"
import { MentionMenu } from "./mention-menu"

interface Block {
  id: string
  type:
    | "paragraph"
    | "heading1"
    | "heading2"
    | "heading3"
    | "quote"
    | "code"
    | "bulletList"
    | "numberedList"
    | "checklist"
    | "divider"
  content: string
  checked?: boolean
}

interface CommandMenuProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (type: Block["type"]) => void
  position: { x: number; y: number }
}

function CommandMenu({ isOpen, onClose, onInsert, position }: CommandMenuProps) {
  if (!isOpen) return null

  const commands = [
    { type: "paragraph" as const, icon: Type, label: "Paragraph", description: "Just start writing with plain text." },
    { type: "heading1" as const, icon: Heading1, label: "Heading 1", description: "Big section heading." },
    { type: "heading2" as const, icon: Heading2, label: "Heading 2", description: "Medium section heading." },
    { type: "heading3" as const, icon: Heading3, label: "Heading 3", description: "Small section heading." },
    { type: "quote" as const, icon: Quote, label: "Quote", description: "Capture a quote." },
    { type: "code" as const, icon: Code, label: "Code", description: "Capture a code snippet." },
    { type: "bulletList" as const, icon: List, label: "Bulleted list", description: "Create a simple bulleted list." },
    {
      type: "numberedList" as const,
      icon: ListOrdered,
      label: "Numbered list",
      description: "Create a list with numbering.",
    },
    {
      type: "checklist" as const,
      icon: CheckSquare,
      label: "To-do list",
      description: "Track tasks with a to-do list.",
    },
    { type: "divider" as const, icon: Minus, label: "Divider", description: "Visually divide blocks." },
  ]

  return (
    <div
      className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg p-2 w-80"
      style={{ left: position.x, top: position.y }}
    >
      <div className="text-xs text-muted-foreground mb-2 px-2">Basic blocks</div>
      {commands.map((command) => (
        <button
          key={command.type}
          className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded text-left"
          onClick={() => {
            onInsert(command.type)
            onClose()
          }}
        >
          <command.icon className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">{command.label}</div>
            <div className="text-xs text-muted-foreground">{command.description}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

interface RichTextEditorProps {
  onContentChange?: (blocks: Block[]) => void
}

export function RichTextEditor({ onContentChange }: RichTextEditorProps) {
  const { collaborators, updateSelection, mentionUser } = useCollaboration()

  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "heading1", content: "Welcome to DocWave" },
    {
      id: "2",
      type: "paragraph",
      content:
        'Start typing to create your document. Use the toolbar above for formatting options, or type "/" to insert blocks and content.',
    },
    {
      id: "3",
      type: "paragraph",
      content:
        "This is a collaborative rich-text editor that supports real-time editing, comments, and suggestions. Invite others to collaborate by clicking the Share button.",
    },
  ])

  const [commandMenu, setCommandMenu] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    blockId: string
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    blockId: "",
  })

  const [mentionMenu, setMentionMenu] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    blockId: string
    query: string
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    blockId: "",
    query: "",
  })

  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onContentChange?.(blocks)
  }, [blocks, onContentChange])

  const updateBlock = (id: string, content: string) => {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, content } : block)))
  }

  const insertBlock = (afterId: string, type: Block["type"]) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: "",
      ...(type === "checklist" && { checked: false }),
    }

    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === afterId)
      const newBlocks = [...prev]
      newBlocks.splice(index + 1, 0, newBlock)
      return newBlocks
    })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>, blockId: string) => {
    if (e.key === "/") {
      const rect = e.currentTarget.getBoundingClientRect()
      setCommandMenu({
        isOpen: true,
        position: { x: rect.left, y: rect.bottom + 5 },
        blockId,
      })
    } else if (e.key === "@") {
      const rect = e.currentTarget.getBoundingClientRect()
      setMentionMenu({
        isOpen: true,
        position: { x: rect.left, y: rect.bottom + 5 },
        blockId,
        query: "",
      })
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      insertBlock(blockId, "paragraph")
    }
  }

  const handleSelectionChange = (blockId: string, start: number, end: number) => {
    if (start !== end) {
      updateSelection(blockId, start, end)
    }
  }

  const handleMention = (userId: string, userName: string) => {
    const block = blocks.find((b) => b.id === mentionMenu.blockId)
    if (block) {
      const newContent = block.content + `@${userName} `
      updateBlock(mentionMenu.blockId, newContent)
      mentionUser(userId)
    }
  }

  const toggleChecklist = (id: string) => {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, checked: !block.checked } : block)))
  }

  const renderBlock = (block: Block) => {
    const baseClasses = "w-full border-none bg-transparent resize-none outline-none focus:outline-none"

    const blockCollaborators = collaborators.filter(
      (user) => user.cursor?.blockId === block.id || user.selection?.blockId === block.id,
    )

    const renderContentWithCollaboration = (content: string, inputElement: React.ReactElement) => {
      const collaboratorWithSelection = blockCollaborators.find((user) => user.selection)

      if (collaboratorWithSelection?.selection) {
        const { start, end } = collaboratorWithSelection.selection
        const beforeSelection = content.slice(0, start)
        const selectedText = content.slice(start, end)
        const afterSelection = content.slice(end)

        return (
          <div className="relative">
            {inputElement}
            {selectedText && (
              <UserSelection userName={collaboratorWithSelection.name} color={collaboratorWithSelection.color}>
                <span className="absolute inset-0 pointer-events-none">
                  {beforeSelection}
                  <span style={{ backgroundColor: `${collaboratorWithSelection.color}30` }}>{selectedText}</span>
                  {afterSelection}
                </span>
              </UserSelection>
            )}
          </div>
        )
      }

      return inputElement
    }

    switch (block.type) {
      case "heading1":
        return (
          <div key={block.id} className="group relative">
            {renderContentWithCollaboration(
              block.content,
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                onSelect={(e) => {
                  const target = e.target as HTMLInputElement
                  handleSelectionChange(block.id, target.selectionStart || 0, target.selectionEnd || 0)
                }}
                className={cn(baseClasses, "text-3xl font-bold text-card-foreground mb-4")}
                placeholder="Heading 1"
              />,
            )}
            {blockCollaborators.map(
              (user) =>
                user.cursor && (
                  <UserCursor
                    key={user.id}
                    userName={user.name}
                    color={user.color}
                    position={{ x: user.cursor.position * 8, y: 0 }}
                  />
                ),
            )}
          </div>
        )

      case "heading2":
        return (
          <div key={block.id} className="group relative">
            {renderContentWithCollaboration(
              block.content,
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                onSelect={(e) => {
                  const target = e.target as HTMLInputElement
                  handleSelectionChange(block.id, target.selectionStart || 0, target.selectionEnd || 0)
                }}
                className={cn(baseClasses, "text-2xl font-semibold text-card-foreground mb-3")}
                placeholder="Heading 2"
              />,
            )}
            {blockCollaborators.map(
              (user) =>
                user.cursor && (
                  <UserCursor
                    key={user.id}
                    userName={user.name}
                    color={user.color}
                    position={{ x: user.cursor.position * 8, y: 0 }}
                  />
                ),
            )}
          </div>
        )

      case "heading3":
        return (
          <div key={block.id} className="group relative">
            {renderContentWithCollaboration(
              block.content,
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                onSelect={(e) => {
                  const target = e.target as HTMLInputElement
                  handleSelectionChange(block.id, target.selectionStart || 0, target.selectionEnd || 0)
                }}
                className={cn(baseClasses, "text-xl font-medium text-card-foreground mb-2")}
                placeholder="Heading 3"
              />,
            )}
            {blockCollaborators.map(
              (user) =>
                user.cursor && (
                  <UserCursor
                    key={user.id}
                    userName={user.name}
                    color={user.color}
                    position={{ x: user.cursor.position * 8, y: 0 }}
                  />
                ),
            )}
          </div>
        )

      case "quote":
        return (
          <div key={block.id} className="group relative">
            <div className="border-l-4 border-primary pl-4 py-2">
              {renderContentWithCollaboration(
                block.content,
                <textarea
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, block.id)}
                  onSelect={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    handleSelectionChange(block.id, target.selectionStart || 0, target.selectionEnd || 0)
                  }}
                  className={cn(baseClasses, "text-card-foreground italic")}
                  placeholder="Quote"
                  rows={1}
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = "auto"
                    target.style.height = target.scrollHeight + "px"
                  }}
                />,
              )}
              {blockCollaborators.map(
                (user) =>
                  user.cursor && (
                    <UserCursor
                      key={user.id}
                      userName={user.name}
                      color={user.color}
                      position={{ x: user.cursor.position * 8, y: 0 }}
                    />
                  ),
              )}
            </div>
          </div>
        )

      case "code":
        return (
          <div key={block.id} className="group relative">
            <div className="bg-muted rounded-lg p-4 font-mono text-sm relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {renderContentWithCollaboration(
                block.content,
                <textarea
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, block.id)}
                  onSelect={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    handleSelectionChange(block.id, target.selectionStart || 0, target.selectionEnd || 0)
                  }}
                  className={cn(baseClasses, "font-mono text-sm text-card-foreground")}
                  placeholder="Code"
                  rows={3}
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = "auto"
                    target.style.height = target.scrollHeight + "px"
                  }}
                />,
              )}
              {blockCollaborators.map(
                (user) =>
                  user.cursor && (
                    <UserCursor
                      key={user.id}
                      userName={user.name}
                      color={user.color}
                      position={{ x: user.cursor.position * 8, y: 0 }}
                    />
                  ),
              )}
            </div>
          </div>
        )

      case "bulletList":
        return (
          <div key={block.id} className="group relative flex items-start gap-3">
            <div className="w-2 h-2 bg-card-foreground rounded-full mt-3 flex-shrink-0" />
            {renderContentWithCollaboration(
              block.content,
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                onSelect={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  handleSelectionChange(block.id, target.selectionStart || 0, target.selectionEnd || 0)
                }}
                className={cn(baseClasses, "text-card-foreground flex-1")}
                placeholder="List item"
                rows={1}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "auto"
                  target.style.height = target.scrollHeight + "px"
                }}
              />,
            )}
            {blockCollaborators.map(
              (user) =>
                user.cursor && (
                  <UserCursor
                    key={user.id}
                    userName={user.name}
                    color={user.color}
                    position={{ x: user.cursor.position * 8, y: 0 }}
                  />
                ),
            )}
          </div>
        )

      case "numberedList":
        return (
          <div key={block.id} className="group relative flex items-start gap-3">
            <div className="text-card-foreground font-medium mt-1 flex-shrink-0">1.</div>
            {renderContentWithCollaboration(
              block.content,
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                onSelect={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  handleSelectionChange(block.id, target.selectionStart || 0, target.selectionEnd || 0)
                }}
                className={cn(baseClasses, "text-card-foreground flex-1")}
                placeholder="List item"
                rows={1}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "auto"
                  target.style.height = target.scrollHeight + "px"
                }}
              />,
            )}
            {blockCollaborators.map(
              (user) =>
                user.cursor && (
                  <UserCursor
                    key={user.id}
                    userName={user.name}
                    color={user.color}
                    position={{ x: user.cursor.position * 8, y: 0 }}
                  />
                ),
            )}
          </div>
        )

      case "checklist":
        return (
          <div key={block.id} className="group relative flex items-start gap-3">
            <button
              onClick={() => toggleChecklist(block.id)}
              className="w-5 h-5 border-2 border-border rounded mt-1 flex-shrink-0 flex items-center justify-center hover:border-primary transition-colors"
            >
              {block.checked && <div className="w-3 h-3 bg-primary rounded-sm" />}
            </button>
            {renderContentWithCollaboration(
              block.content,
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                onSelect={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  handleSelectionChange(block.id, target.selectionStart || 0, target.selectionEnd || 0)
                }}
                className={cn(baseClasses, "text-card-foreground flex-1", block.checked && "line-through opacity-60")}
                placeholder="To-do"
                rows={1}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "auto"
                  target.style.height = target.scrollHeight + "px"
                }}
              />,
            )}
            {blockCollaborators.map(
              (user) =>
                user.cursor && (
                  <UserCursor
                    key={user.id}
                    userName={user.name}
                    color={user.color}
                    position={{ x: user.cursor.position * 8, y: 0 }}
                  />
                ),
            )}
          </div>
        )

      case "divider":
        return (
          <div key={block.id} className="group relative py-4">
            <hr className="border-border" />
            {blockCollaborators.map(
              (user) =>
                user.cursor && (
                  <UserCursor
                    key={user.id}
                    userName={user.name}
                    color={user.color}
                    position={{ x: user.cursor.position * 8, y: 0 }}
                  />
                ),
            )}
          </div>
        )

      default:
        return (
          <div key={block.id} className="group relative">
            {renderContentWithCollaboration(
              block.content,
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                onSelect={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  handleSelectionChange(block.id, target.selectionStart || 0, target.selectionEnd || 0)
                }}
                className={cn(baseClasses, "text-card-foreground leading-relaxed")}
                placeholder="Type '/' for commands, '@' to mention"
                rows={1}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "auto"
                  target.style.height = target.scrollHeight + "px"
                }}
              />,
            )}
            {blockCollaborators.map(
              (user) =>
                user.cursor && (
                  <UserCursor
                    key={user.id}
                    userName={user.name}
                    color={user.color}
                    position={{ x: user.cursor.position * 8, y: 0 }}
                  />
                ),
            )}
          </div>
        )
    }
  }

  return (
    <div ref={editorRef} className="space-y-4">
      {blocks.map(renderBlock)}

      <CommandMenu
        isOpen={commandMenu.isOpen}
        onClose={() => setCommandMenu((prev) => ({ ...prev, isOpen: false }))}
        onInsert={(type) => insertBlock(commandMenu.blockId, type)}
        position={commandMenu.position}
      />

      <MentionMenu
        isOpen={mentionMenu.isOpen}
        onClose={() => setMentionMenu((prev) => ({ ...prev, isOpen: false }))}
        onMention={handleMention}
        position={mentionMenu.position}
        query={mentionMenu.query}
      />
    </div>
  )
}
