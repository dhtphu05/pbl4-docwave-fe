"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useDocuments, type Document } from "./document-provider"
import { Search, FileText, Star, Users, Clock, Hash } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const { searchDocuments, searchQuery, setSearchQuery } = useDocuments()
  const [results, setResults] = useState<Document[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (searchQuery.trim()) {
      const searchResults = searchDocuments(searchQuery)
      setResults(searchResults)
      setSelectedIndex(0)
    } else {
      setResults([])
    }
  }, [searchQuery, searchDocuments])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelectDocument(results[selectedIndex])
    }
  }

  const handleSelectDocument = (document: Document) => {
    // In a real app, this would navigate to the document
    console.log("Opening document:", document.title)
    onClose()
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Search Documents</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents, content, and comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 text-lg border-none shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {searchQuery.trim() === "" ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start typing to search your documents</p>
              <div className="mt-4 text-sm space-y-1">
                <p>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">in:me</kbd> - Your documents
                </p>
                <p>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">has:comment</kbd> - Documents with comments
                </p>
                <p>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">type:shared</kbd> - Shared documents
                </p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                No documents found for <span>&quot;{searchQuery}&quot;</span>
              </p>
            </div>
          ) : (
            <div className="p-2">
              {results.map((document, index) => (
                <button
                  key={document.id}
                  onClick={() => handleSelectDocument(document)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left hover:bg-accent transition-colors",
                    index === selectedIndex && "bg-accent",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{document.title}</h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {document.isStarred && <Star className="h-3 w-3 text-yellow-500" />}
                          {document.isShared && <Users className="h-3 w-3 text-blue-500" />}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {document.content.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(document.modifiedAt)}
                        </div>
                        <div>{document.size}</div>
                        {document.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {document.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-muted/50 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <div>
              Use <kbd className="px-1 py-0.5 bg-background rounded">↑</kbd>{" "}
              <kbd className="px-1 py-0.5 bg-background rounded">↓</kbd> to navigate,{" "}
              <kbd className="px-1 py-0.5 bg-background rounded">Enter</kbd> to select
            </div>
            <div>{results.length > 0 && `${results.length} result${results.length === 1 ? "" : "s"}`}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
