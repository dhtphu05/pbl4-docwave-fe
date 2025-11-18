"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDocuments } from "@/components/document-provider"
import { FileText, Search, Star, Share2, MoreHorizontal, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function DocumentsPage() {
  const { getRecentDocuments, getStarredDocuments, getSharedDocuments, getTrashedDocuments, createDocument } =
    useDocuments()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"recent" | "starred" | "shared" | "trash">("recent")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const getDocuments = () => {
    switch (activeTab) {
      case "starred":
        return getStarredDocuments()
      case "shared":
        return getSharedDocuments()
      case "trash":
        return getTrashedDocuments()
      default:
        return getRecentDocuments()
    }
  }

  const filteredDocs = getDocuments().filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    }).format(date)
  }

  const handleNewDocument = useCallback(async () => {
    if (isCreating) return
    setIsCreating(true)
    try {
      const doc = await createDocument("Untitled Document")
      if (doc?.id) {
        router.push(`/editor?id=${doc.id}`)
      }
    } finally {
      setIsCreating(false)
    }
  }, [createDocument, isCreating, router])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg text-foreground">DocWave</span>
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleNewDocument} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? "Creating..." : "New Document"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Tabs */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            {(["recent", "starred", "shared", "trash"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Documents List */}
          <div className="space-y-2">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No documents found matching your search." : `No ${activeTab} documents yet.`}
                </p>
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <Link key={doc.id} href={`/editor?id=${doc.id}`}>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Modified {formatDate(doc.modifiedAt)} • {doc.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      {doc.isShared && <Share2 className="h-4 w-4 text-muted-foreground" />}
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={doc.owner.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{doc.owner.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
