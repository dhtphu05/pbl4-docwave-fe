"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useCollaboration } from "@/components/collaboration-provider"
import { useComments } from "@/components/comments-provider"
import { useDocuments } from "@/components/document-provider"
import { ShareDialog } from "@/components/share-dialog"
import { SearchDialog } from "@/components/search-dialog"
import { TemplateGallery } from "@/components/template-gallery"
import { MobileToolbar } from "@/components/mobile-toolbar"
import { MobileDrawer } from "@/components/mobile-drawer"
import { UserMenu } from "@/components/user-menu"
import { TiptapEditor } from "@/components/editor/tiptap-editor"
import {
  Search,
  Share2,
  MessageSquare,
  MoreHorizontal,
  FileText,
  Star,
  Users,
  Trash2,
  Plus,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  CheckSquare,
  ImageIcon,
  Table,
  Smile,
  AtSign,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

function parseDocumentContent(rawContent?: string) {
  if (!rawContent) return undefined
  try {
    const parsed = JSON.parse(rawContent)
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed
    }
    return undefined
  } catch {
    // not JSON, fall through to return raw string
  }
  return rawContent
}

interface DocWaveEditorContentProps {
  docId?: string
}

function DocWaveEditorContent({ docId }: DocWaveEditorContentProps) {
  const { currentUser } = useCollaboration()
  // Comments are temporarily disabled
  const { suggestionMode, toggleSuggestionMode } = useComments()
  const {
    currentDocument,
    updateDocument,
    createDocument,
    selectDocument,
    refreshDocument,
    accessError,
    clearAccessError,
  } = useDocuments()
  const [documentTitle, setDocumentTitle] = useState(currentDocument?.title || "Untitled Document")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [syncStatus, setSyncStatus] = useState<"saved" | "saving" | "offline" | "replaying" | "conflict">("saved")
  const [lastSaved, setLastSaved] = useState(new Date())
  const [searchOpen, setSearchOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)
  const [presenceUsers, setPresenceUsers] = useState<
    Array<{ id: string; name: string; avatar?: string; color?: string }>
  >([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDocIdInUrl = searchParams?.get("id") ?? undefined

  const resolvedInitialContent = useMemo(
    () => parseDocumentContent(currentDocument?.content),
    [currentDocument?.id, currentDocument?.content],
  )

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
        setRightPanelOpen(false)
      } else {
        setSidebarOpen(true)
        setRightPanelOpen(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (currentDocument) {
      setDocumentTitle(currentDocument.title)
      setLastSaved(new Date(currentDocument.modifiedAt))
    }
  }, [currentDocument])

  useEffect(() => {
    selectDocument(docId ?? null)
    clearAccessError()
  }, [docId, selectDocument])

  // Poll document metadata to catch role changes (e.g., demote editor -> viewer)
  useEffect(() => {
    if (!currentDocument?.id) return
    const interval = setInterval(() => {
      refreshDocument(currentDocument.id).catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [currentDocument?.id, refreshDocument])

  useEffect(() => {
    if (!currentDocument) return
    // If URL already has an id (user clicked a specific doc), don't override it.
    if (currentDocIdInUrl) return
    // Only push id when missing to avoid jumping between previous/current doc.
    if (currentDocIdInUrl === currentDocument.id) return
    const url = `/editor?id=${currentDocument.id}`
    router.replace(url)
  }, [currentDocument?.id, currentDocIdInUrl, router])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleTitleChange = (newTitle: string) => {
    setDocumentTitle(newTitle)
    if (currentDocument) {
      updateDocument(currentDocument.id, { title: newTitle })
    }
  }

  const handleNewDocument = () => {
    createDocument("Untitled Document")
    setSyncStatus("saved")
  }

  const handleEditorSave = useCallback(
    async (json: unknown) => {
      if (!currentDocument) return
      const stringified = JSON.stringify(json)
      updateDocument(currentDocument.id, {
        content: stringified,
        size: `${Math.round((stringified.length / 1024) * 10) / 10} KB`,
      })
      setLastSaved(new Date())
    },
    [currentDocument, updateDocument],
  )

  const handleStatusChange = useCallback((status: "saved" | "saving" | "offline") => {
    setSyncStatus(status)
  }, [])

  const handleInsertImage = useCallback(() => {
    if (!editorInstance) return
    const url = typeof window !== "undefined" ? window.prompt("Image URL") : null
    if (!url) return
    editorInstance.chain().focus().setImage({ src: url }).run()
  }, [editorInstance])

  const handleInsertTable = useCallback(() => {
    editorInstance
      ?.chain()
      .focus()
      .insertTable({
        rows: 3,
        cols: 3,
        withHeaderRow: true,
      })
      .run()
  }, [editorInstance])

  const editor = editorInstance

  const getSyncStatusDisplay = () => {
    switch (syncStatus) {
      case "saved":
        return { text: "✓ Saved", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" }
      case "saving":
        return { text: "Saving...", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" }
      case "offline":
        return {
          text: "Offline — changes queued",
          className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        }
      case "replaying":
        return { text: "Replaying...", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" }
      case "conflict":
        return { text: "Conflict", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" }
      default:
        return { text: "✓ Saved", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" }
    }
  }

  const statusDisplay = getSyncStatusDisplay()

  if (accessError) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-muted-foreground px-6 text-center">
        <div className="space-y-3 max-w-md">
          <div className="text-lg font-semibold text-foreground">Không thể mở tài liệu</div>
          <div>{accessError}</div>
          <Button onClick={() => router.push("/documents")}>Quay lại Documents</Button>
        </div>
      </div>
    )
  }

  if (!currentDocument) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-muted-foreground">
        No document selected
      </div>
    )
  }

  const canWrite =
    currentDocument?.currentRole === "owner" || currentDocument?.currentRole === "editor"

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Topbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-border bg-background">
        {/* Left section */}
        <div className="flex items-center gap-2 md:gap-4 flex-wrap md:flex-nowrap">
          <MobileDrawer onNewDocument={handleNewDocument} />

          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg text-foreground hidden sm:inline">DocWave</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={documentTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="border-none bg-transparent text-base md:text-lg font-medium focus:bg-muted px-2 py-1 rounded w-32 sm:w-auto"
            />
            <span className="text-sm text-muted-foreground hidden lg:inline">/ Workspace / Folder</span>
          </div>
        </div>

        {/* Center - Toolbar (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={!editor?.commands?.undo}
            onClick={() => editor?.commands?.undo?.()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!editor?.commands?.redo}
            onClick={() => editor?.commands?.redo?.()}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant={editor?.isActive("bold") ? "default" : "ghost"}
            size="sm"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            aria-pressed={!!editor?.isActive("bold")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor?.isActive("italic") ? "default" : "ghost"}
            size="sm"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            aria-pressed={!!editor?.isActive("italic")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor?.isActive("underline") ? "default" : "ghost"}
            size="sm"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            aria-pressed={!!editor?.isActive("underline")}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant={editor?.isActive({ textAlign: "left" }) ? "default" : "ghost"}
            size="sm"
            disabled={!editor}
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
            aria-pressed={!!editor?.isActive({ textAlign: "left" })}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={editor?.isActive({ textAlign: "center" }) ? "default" : "ghost"}
            size="sm"
            disabled={!editor}
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
            aria-pressed={!!editor?.isActive({ textAlign: "center" })}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={editor?.isActive({ textAlign: "right" }) ? "default" : "ghost"}
            size="sm"
            disabled={!editor}
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
            aria-pressed={!!editor?.isActive({ textAlign: "right" })}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant={editor?.isActive("bulletList") ? "default" : "ghost"}
            size="sm"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            aria-pressed={!!editor?.isActive("bulletList")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor?.isActive("orderedList") ? "default" : "ghost"}
            size="sm"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            aria-pressed={!!editor?.isActive("orderedList")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant={editor?.isActive("taskList") ? "default" : "ghost"}
            size="sm"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            aria-pressed={!!editor?.isActive("taskList")}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="sm" disabled={!editor} onClick={handleInsertImage}>
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled={!editor} onClick={handleInsertTable}>
            <Table className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!editor}
            onClick={() => editor?.chain().focus().insertContent(":) ").run()}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!editor}
            onClick={() => editor?.chain().focus().insertContent("@").run()}
          >
            <AtSign className="h-4 w-4" />
          </Button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap md:flex-nowrap justify-end">
          {(() => {
            const uniques = [currentUser, ...presenceUsers].filter(
              (u, idx, arr) => u && u.id && arr.findIndex((x) => x?.id === u.id) === idx,
            )
            const capacity = isMobile ? 2 : 3
            const visibleUsers = uniques.slice(0, capacity)
            const remaining = Math.max(uniques.length - capacity, 0)
            return (
              <>
                <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)} className="hidden sm:flex">
                  <Search className="h-4 w-4" />
                </Button>
                <ShareDialog documentId={currentDocument?.id || "1"}>
                  <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
                    <Share2 className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Share</span>
                  </Button>
                </ShareDialog>
                <Button
                  variant={suggestionMode ? "default" : "ghost"}
                  size="sm"
                  onClick={toggleSuggestionMode}
                  className={cn(suggestionMode ? "bg-primary hover:bg-primary/90" : "", "hidden md:flex")}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <div className="hidden sm:flex -space-x-2">
                  {visibleUsers.map((user) => (
                    <Avatar
                      key={user.id}
                      className="h-6 w-6 md:h-8 md:w-8 border-2 border-background"
                      title={user.email ?? user.name}
                    >
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback style={{ backgroundColor: user.color, color: "white" }}>
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {remaining > 0 && (
                    <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                      +{remaining}
                    </div>
                  )}
                </div>
              </>
            )
          })()}
          <Badge variant="secondary" className={cn("text-xs hidden sm:flex", statusDisplay.className)}>
            {statusDisplay.text}
          </Badge>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <div className="hidden md:flex">
            <UserMenu />
          </div>
          <UserMenu variant="icon" className="md:hidden" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (hidden on mobile) */}
        {sidebarOpen && !isMobile && (
          <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
            <div className="p-4 border-b border-sidebar-border">
              <h2 className="font-semibold text-sidebar-foreground mb-3">Docs Home</h2>
              <TemplateGallery>
                <Button className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  New Document
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </TemplateGallery>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Recent
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Starred
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Shared with me
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Trash
                </Button>
              </div>
            </nav>

            <div className="p-4 border-t border-sidebar-border">
              <h3 className="font-medium text-sidebar-foreground mb-2">Table of Contents</h3>
              <div className="space-y-1 text-sm">
                <div className="text-sidebar-foreground hover:text-sidebar-primary cursor-pointer py-1">
                  Introduction
                </div>
                <div className="text-sidebar-foreground hover:text-sidebar-primary cursor-pointer py-1 pl-4">
                  Overview
                </div>
                <div className="text-sidebar-foreground hover:text-sidebar-primary cursor-pointer py-1">
                  Main Content
                </div>
                <div className="text-sidebar-foreground hover:text-sidebar-primary cursor-pointer py-1">Conclusion</div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Canvas */}
        <main className="flex-1 bg-card overflow-auto">
          <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20 md:pb-8 space-y-3">
            {!canWrite && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-2 rounded-md border bg-muted/50">
                <div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                Tài liệu ở chế độ chỉ xem. Bạn không có quyền chỉnh sửa.
              </div>
            )}
            <div className="bg-background min-h-[800px] rounded-lg shadow-sm border border-border p-4 md:p-8 touch-manipulation">
              {currentDocument && (
                <TiptapEditor
                  docId={currentDocument.id}
                  initialContent={resolvedInitialContent}
                  onSave={handleEditorSave}
                  onStatusChange={handleStatusChange}
                  onEditorReady={setEditorInstance}
                  onPresenceChange={setPresenceUsers}
                  canWrite={!!canWrite}
                />
              )}
            </div>
          </div>
        </main>

        {/* Right Panel (hidden on mobile) */}
        {rightPanelOpen && !isMobile && (
          <aside className="w-80 bg-popover border-l border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-popover-foreground">Comments</h3>
              <p className="text-sm text-muted-foreground">Bình luận sẽ sớm khả dụng.</p>
            </div>

            <div className="p-4 border-t border-border">
              <h3 className="font-medium text-popover-foreground mb-3">Document Properties</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="ml-2 text-popover-foreground">
                    {currentDocument?.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Modified:</span>
                  <span className="ml-2 text-popover-foreground">{lastSaved.toLocaleTimeString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Owner:</span>
                  <span className="ml-2 text-popover-foreground">{currentDocument?.owner.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <span className="ml-2 text-popover-foreground">{currentDocument?.size}</span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      <MobileToolbar editor={editorInstance} />

      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

interface DocWaveEditorProps {
  docId?: string
}

export function DocWaveEditor({ docId }: DocWaveEditorProps = {}) {
  return <DocWaveEditorContent docId={docId} />
}
