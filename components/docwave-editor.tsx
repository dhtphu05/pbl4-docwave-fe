"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RichTextEditor } from "@/components/rich-text-editor"
import { useCollaboration } from "@/components/collaboration-provider"
import { useComments } from "@/components/comments-provider"
import { useDocuments } from "@/components/document-provider"
import { CommentsPanel } from "@/components/comments-panel"
import { ShareDialog } from "@/components/share-dialog"
import { SearchDialog } from "@/components/search-dialog"
import { TemplateGallery } from "@/components/template-gallery"
import { MobileToolbar } from "@/components/mobile-toolbar"
import { MobileDrawer } from "@/components/mobile-drawer"
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

type EditorBlock = {
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

function DocWaveEditorContent() {
  const { onlineUsers } = useCollaboration()
  const { suggestionMode, toggleSuggestionMode } = useComments()
  const { currentDocument, updateDocument, createDocument } = useDocuments()
  const [documentTitle, setDocumentTitle] = useState(currentDocument?.title || "Untitled Document")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [syncStatus, setSyncStatus] = useState<"saved" | "saving" | "offline" | "replaying" | "conflict">("saved")
  const [lastSaved, setLastSaved] = useState(new Date())
  const [searchOpen, setSearchOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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
    }
  }, [currentDocument])

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

  const handleContentChange = (blocks: EditorBlock[]) => {
    // Simulate auto-save behavior
    setSyncStatus("saving")
    setTimeout(() => {
      setSyncStatus("saved")
      setLastSaved(new Date())
      if (currentDocument) {
        updateDocument(currentDocument.id, {
          content: JSON.stringify(blocks),
          size: `${Math.round((JSON.stringify(blocks).length / 1024) * 10) / 10} KB`,
        })
      }
    }, 500)
  }

  const handleTitleChange = (newTitle: string) => {
    setDocumentTitle(newTitle)
    if (currentDocument) {
      updateDocument(currentDocument.id, { title: newTitle })
    }
  }

  const handleNewDocument = () => {
    createDocument("Untitled Document")
  }

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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Topbar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        {/* Left section */}
        <div className="flex items-center gap-2 md:gap-4">
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
          <Button variant="ghost" size="sm">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Redo className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
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
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <AlignRight className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="sm">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <CheckSquare className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="sm">
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Table className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Smile className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <AtSign className="h-4 w-4" />
          </Button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 md:gap-3">
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
            {onlineUsers.slice(0, isMobile ? 2 : 3).map((user) => (
              <Avatar key={user.id} className="h-6 w-6 md:h-8 md:w-8 border-2 border-background">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback style={{ backgroundColor: user.color, color: "white" }}>
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {onlineUsers.length > (isMobile ? 2 : 3) && (
              <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                +{onlineUsers.length - (isMobile ? 2 : 3)}
              </div>
            )}
          </div>
          <Badge variant="secondary" className={cn("text-xs hidden sm:flex", statusDisplay.className)}>
            {statusDisplay.text}
          </Badge>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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
          <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
            <div className="bg-background min-h-[800px] rounded-lg shadow-sm border border-border p-4 md:p-8 touch-manipulation">
              <RichTextEditor onContentChange={handleContentChange} />
            </div>
          </div>
        </main>

        {/* Right Panel (hidden on mobile) */}
        {rightPanelOpen && !isMobile && (
          <aside className="w-80 bg-popover border-l border-border flex flex-col">
            <CommentsPanel />

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

      <MobileToolbar />

      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

export function DocWaveEditor() {
  return <DocWaveEditorContent />
}
