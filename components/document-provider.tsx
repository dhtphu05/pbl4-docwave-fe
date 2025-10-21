"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface Document {
  id: string
  title: string
  content: string
  owner: {
    id: string
    name: string
    avatar: string
  }
  createdAt: Date
  modifiedAt: Date
  isStarred: boolean
  isShared: boolean
  permissions: {
    userId: string
    role: "viewer" | "commenter" | "editor" | "owner"
  }[]
  tags: string[]
  size: string
  status: "active" | "trashed"
}

export interface ShareSettings {
  isPublic: boolean
  publicLink?: string
  allowComments: boolean
  allowEditing: boolean
  expiresAt?: Date
  password?: string
  requireSignIn: boolean
}

interface DocumentContextType {
  documents: Document[]
  currentDocument: Document | null
  shareSettings: ShareSettings
  searchQuery: string
  setSearchQuery: (query: string) => void
  createDocument: (title: string) => Document
  updateDocument: (id: string, updates: Partial<Document>) => void
  deleteDocument: (id: string) => void
  restoreDocument: (id: string) => void
  starDocument: (id: string) => void
  unstarDocument: (id: string) => void
  shareDocument: (id: string, settings: ShareSettings) => void
  addCollaborator: (documentId: string, email: string, role: "viewer" | "commenter" | "editor") => void
  removeCollaborator: (documentId: string, userId: string) => void
  updateCollaboratorRole: (documentId: string, userId: string, role: "viewer" | "commenter" | "editor") => void
  getRecentDocuments: () => Document[]
  getStarredDocuments: () => Document[]
  getSharedDocuments: () => Document[]
  getTrashedDocuments: () => Document[]
  searchDocuments: (query: string) => Document[]
}

const DocumentContext = createContext<DocumentContextType | null>(null)

export function useDocuments() {
  const context = useContext(DocumentContext)
  if (!context) {
    throw new Error("useDocuments must be used within DocumentProvider")
  }
  return context
}

interface DocumentProviderProps {
  children: ReactNode
}

export function DocumentProvider({ children }: DocumentProviderProps) {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      title: "Welcome to DocWave",
      content: "This is your first document...",
      owner: {
        id: "user-1",
        name: "You",
        avatar: "/abstract-geometric-shapes.png",
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      modifiedAt: new Date(),
      isStarred: true,
      isShared: true,
      permissions: [
        { userId: "user-1", role: "owner" },
        { userId: "user-2", role: "editor" },
        { userId: "user-3", role: "commenter" },
      ],
      tags: ["welcome", "getting-started"],
      size: "1.2 KB",
      status: "active",
    },
    {
      id: "2",
      title: "Project Proposal Draft",
      content: "Executive summary...",
      owner: {
        id: "user-1",
        name: "You",
        avatar: "/abstract-geometric-shapes.png",
      },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      modifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      isStarred: false,
      isShared: false,
      permissions: [{ userId: "user-1", role: "owner" }],
      tags: ["project", "draft"],
      size: "3.4 KB",
      status: "active",
    },
    {
      id: "3",
      title: "Meeting Notes - Q4 Planning",
      content: "Attendees: Alice, Bob, Charlie...",
      owner: {
        id: "user-2",
        name: "Alice Johnson",
        avatar: "/abstract-geometric-shapes.png",
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      modifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isStarred: true,
      isShared: true,
      permissions: [
        { userId: "user-2", role: "owner" },
        { userId: "user-1", role: "editor" },
      ],
      tags: ["meeting", "planning"],
      size: "2.1 KB",
      status: "active",
    },
    {
      id: "4",
      title: "Old Document",
      content: "This document was deleted...",
      owner: {
        id: "user-1",
        name: "You",
        avatar: "/abstract-geometric-shapes.png",
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      modifiedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      isStarred: false,
      isShared: false,
      permissions: [{ userId: "user-1", role: "owner" }],
      tags: [],
      size: "0.8 KB",
      status: "trashed",
    },
  ])

  const [currentDocument, setCurrentDocument] = useState<Document | null>(documents[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: false,
    allowComments: true,
    allowEditing: false,
    requireSignIn: true,
  })

  const createDocument = (title: string): Document => {
    const newDoc: Document = {
      id: Date.now().toString(),
      title,
      content: "",
      owner: {
        id: "user-1",
        name: "You",
        avatar: "/abstract-geometric-shapes.png",
      },
      createdAt: new Date(),
      modifiedAt: new Date(),
      isStarred: false,
      isShared: false,
      permissions: [{ userId: "user-1", role: "owner" }],
      tags: [],
      size: "0 KB",
      status: "active",
    }
    setDocuments((prev) => [newDoc, ...prev])
    setCurrentDocument(newDoc)
    return newDoc
  }

  const updateDocument = (id: string, updates: Partial<Document>) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, ...updates, modifiedAt: new Date() } : doc)))
    if (currentDocument?.id === id) {
      setCurrentDocument((prev) => (prev ? { ...prev, ...updates, modifiedAt: new Date() } : null))
    }
  }

  const deleteDocument = (id: string) => {
    updateDocument(id, { status: "trashed" })
  }

  const restoreDocument = (id: string) => {
    updateDocument(id, { status: "active" })
  }

  const starDocument = (id: string) => {
    updateDocument(id, { isStarred: true })
  }

  const unstarDocument = (id: string) => {
    updateDocument(id, { isStarred: false })
  }

  const shareDocument = (id: string, settings: ShareSettings) => {
    setShareSettings(settings)
    updateDocument(id, { isShared: settings.isPublic || settings.allowComments || settings.allowEditing })
  }

  const addCollaborator = (documentId: string, email: string, role: "viewer" | "commenter" | "editor") => {
    // In a real app, this would send an invitation email
    const newUserId = `user-${Date.now()}`
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              permissions: [...doc.permissions, { userId: newUserId, role }],
              isShared: true,
            }
          : doc,
      ),
    )
  }

  const removeCollaborator = (documentId: string, userId: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              permissions: doc.permissions.filter((p) => p.userId !== userId),
            }
          : doc,
      ),
    )
  }

  const updateCollaboratorRole = (documentId: string, userId: string, role: "viewer" | "commenter" | "editor") => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              permissions: doc.permissions.map((p) => (p.userId === userId ? { ...p, role } : p)),
            }
          : doc,
      ),
    )
  }

  const getRecentDocuments = () => {
    return documents
      .filter((doc) => doc.status === "active")
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
      .slice(0, 10)
  }

  const getStarredDocuments = () => {
    return documents
      .filter((doc) => doc.status === "active" && doc.isStarred)
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
  }

  const getSharedDocuments = () => {
    return documents
      .filter((doc) => doc.status === "active" && (doc.isShared || doc.owner.id !== "user-1"))
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
  }

  const getTrashedDocuments = () => {
    return documents
      .filter((doc) => doc.status === "trashed")
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
  }

  const searchDocuments = (query: string) => {
    if (!query.trim()) return []

    const lowercaseQuery = query.toLowerCase()
    return documents
      .filter(
        (doc) =>
          doc.status === "active" &&
          (doc.title.toLowerCase().includes(lowercaseQuery) ||
            doc.content.toLowerCase().includes(lowercaseQuery) ||
            doc.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))),
      )
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
  }

  return (
    <DocumentContext.Provider
      value={{
        documents,
        currentDocument,
        shareSettings,
        searchQuery,
        setSearchQuery,
        createDocument,
        updateDocument,
        deleteDocument,
        restoreDocument,
        starDocument,
        unstarDocument,
        shareDocument,
        addCollaborator,
        removeCollaborator,
        updateCollaboratorRole,
        getRecentDocuments,
        getStarredDocuments,
        getSharedDocuments,
        getTrashedDocuments,
        searchDocuments,
      }}
    >
      {children}
    </DocumentContext.Provider>
  )
}
