"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { useAuth } from "@/components/auth-provider"

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
  currentRole?: "owner" | "editor" | "commenter" | "viewer"
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
  accessError: string | null
  clearAccessError: () => void
  setSearchQuery: (query: string) => void
  selectDocument: (id: string | null) => void
  refreshDocument: (id: string) => Promise<Document | null>
  createDocument: (title: string) => Promise<Document>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<Document | null>
  deleteDocument: (id: string) => Promise<Document | null>
  restoreDocument: (id: string) => Promise<Document | null>
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
const DEFAULT_AVATAR = "/abstract-geometric-shapes.png"

type ApiDocument = {
  id: string
  title: string
  content: unknown
  createdAt: string
  updatedAt: string
  isArchived: boolean
  createdBy?: {
    id: string
    name?: string | null
    avatarUrl?: string | null
  } | null
}

const serializeContent = (snapshot: unknown): string => {
  if (snapshot === null || snapshot === undefined) return ""
  if (typeof snapshot === "string") return snapshot
  try {
    return JSON.stringify(snapshot)
  } catch {
    return ""
  }
}

const calculateDocSize = (content: string) => {
  if (!content) return "0 KB"
  const bytes = new TextEncoder().encode(content).length
  const kb = Math.round((bytes / 1024) * 10) / 10
  return `${kb} KB`
}

const mapApiDocument = (doc: ApiDocument): Document => {
  const serializedContent = serializeContent(doc.content)
  const ownerId = doc.createdBy?.id ?? "demo-user"
  const normalizeRole = (role?: string): "owner" | "editor" | "commenter" | "viewer" => {
    switch ((role ?? "").toLowerCase()) {
      case "owner":
        return "owner"
      case "edit":
      case "editor":
        return "editor"
      case "comment":
      case "commenter":
        return "commenter"
      default:
        return "viewer"
    }
  }
  const permissions =
    (doc as any).permissions?.map((p: any) => ({
      userId: p.userId,
      role: normalizeRole(p.role),
      email: p.email ?? undefined,
      name: p.name ?? undefined,
      avatar: p.avatar ?? undefined,
    })) ?? []
  const currentRole = normalizeRole((doc as any).currentUserRole)
  return {
    id: doc.id,
    title: doc.title,
    content: serializedContent,
    owner: {
      id: ownerId,
      name: doc.createdBy?.name ?? "Demo User",
      avatar: doc.createdBy?.avatarUrl ?? DEFAULT_AVATAR,
    },
    createdAt: new Date(doc.createdAt),
    modifiedAt: new Date(doc.updatedAt),
    isStarred: false,
    isShared: false,
    currentRole,
    permissions: permissions.length ? permissions : [{ userId: ownerId, role: "owner" }],
    tags: [],
    size: calculateDocSize(serializedContent),
    status: doc.isArchived ? "trashed" : "active",
  }
}

const prepareContentForApi = (content?: string) => {
  if (content === undefined) return undefined
  if (!content) return ""
  try {
    return JSON.parse(content)
  } catch {
    return content
  }
}

const buildLocalDocument = (title = "Untitled Document"): Document => ({
  id: `local-${Date.now()}`,
  title,
  content: "",
  owner: {
    id: "local-user",
    name: "You",
    avatar: DEFAULT_AVATAR,
  },
  createdAt: new Date(),
  modifiedAt: new Date(),
  isStarred: false,
  isShared: false,
  permissions: [{ userId: "local-user", role: "owner" }],
  tags: [],
  size: "0 KB",
  status: "active",
})

export function DocumentProvider({ children }: DocumentProviderProps) {
  const { accessToken, refreshSession } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [accessError, setAccessError] = useState<string | null>(null)
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: false,
    allowComments: true,
    allowEditing: false,
    requireSignIn: true,
  })
  const [preferredDocumentId, setPreferredDocumentId] = useState<string | null>(null)
  const guestDocRef = useRef<Document | null>(null)
  const accessTokenRef = useRef<string | null>(null)

  useEffect(() => {
    accessTokenRef.current = accessToken
  }, [accessToken])

  const ensureGuestDocument = useCallback((): Document => {
    if (!guestDocRef.current) {
      guestDocRef.current = buildLocalDocument("Guest Document")
    }
    setPreferredDocumentId(null)
    setDocuments([guestDocRef.current])
    setCurrentDocument(guestDocRef.current)
    return guestDocRef.current
  }, [])

  const authorizedFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit, retry = true): Promise<Response> => {
      const token = accessTokenRef.current
      if (!token) {
        throw new Error("Missing access token")
      }

      const response = await fetch(input, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401 && retry) {
        // Token có thể đã hết hạn, thử refresh rồi gọi lại 1 lần
        await refreshSession().catch(() => null)
        const refreshedToken = accessTokenRef.current
        if (!refreshedToken || refreshedToken === token) {
          return response
        }
        return authorizedFetch(input, init, false)
      }

      return response
    },
    [refreshSession],
  )

  const createDocument = useCallback(async (title: string): Promise<Document> => {
    if (!accessToken) {
      const fallback = buildLocalDocument(title)
      setDocuments((prev) => [fallback, ...prev])
      setCurrentDocument(fallback)
      return fallback
    }

    const response = await authorizedFetch(`${API_BASE_URL}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    })
    if (!response.ok) {
      throw new Error("Failed to create document")
    }
    const created = mapApiDocument(await response.json())
    setDocuments((prev) => [created, ...prev])
    setCurrentDocument(created)
    return created
  }, [accessToken, authorizedFetch])

  const refreshDocuments = useCallback(async () => {
    if (!accessToken) {
      ensureGuestDocument()
      return
    }
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/documents`)
      if (!response.ok) {
        throw new Error("Failed to load documents")
      }
      const data: ApiDocument[] = await response.json()
      if (data.length === 0) {
        try {
          await createDocument("Untitled Document")
        } catch (creationError) {
          console.error("Auto-create document failed", creationError)
          ensureGuestDocument()
        }
        return
      }
      const mapped = data.map(mapApiDocument)
      setDocuments(mapped)
      setCurrentDocument((prev) => {
        if (preferredDocumentId) {
          return mapped.find((doc) => doc.id === preferredDocumentId) ?? prev ?? mapped[0] ?? null
        }
        if (!prev) return mapped[0] ?? null
        return mapped.find((doc) => doc.id === prev.id) ?? mapped[0] ?? null
      })
    } catch (error) {
      console.error("Failed to fetch documents", error)
      ensureGuestDocument()
    }
  }, [accessToken, createDocument, preferredDocumentId, ensureGuestDocument, authorizedFetch])

  useEffect(() => {
    if (!accessToken) {
      ensureGuestDocument()
      return
    }
    guestDocRef.current = null
    refreshDocuments()
  }, [accessToken, refreshDocuments, ensureGuestDocument])

  const fetchDocumentById = useCallback(async (id: string): Promise<Document | null> => {
    if (!accessToken) return null
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/documents/${id}`)
      if (!response.ok) {
        if (response.status === 403) {
          setAccessError("Bạn không có quyền truy cập tài liệu này.")
        }
        throw new Error("Failed to fetch document")
      }
      setAccessError(null)
      const fetched = mapApiDocument(await response.json())
      setDocuments((prev) => {
        const exists = prev.some((doc) => doc.id === fetched.id)
        if (exists) {
          return prev.map((doc) => (doc.id === fetched.id ? fetched : doc))
        }
        return [fetched, ...prev]
      })
      setCurrentDocument(fetched)
      return fetched
    } catch (error) {
      console.error(`Failed to fetch document ${id}`, error)
      return null
    }
  }, [accessToken, authorizedFetch])
  const refreshDocument = useCallback(
    async (id: string) => {
      return fetchDocumentById(id)
    },
    [fetchDocumentById],
  )

  const updateDocument = useCallback(
    async (id: string, updates: Partial<Document>): Promise<Document | null> => {
      const payload: Record<string, unknown> = {}
      if (updates.title !== undefined) payload.title = updates.title
      if (updates.content !== undefined) payload.content = prepareContentForApi(updates.content)
      if (updates.status !== undefined) payload.isArchived = updates.status === "trashed"

      let apiDoc: Document | null = null
      if (Object.keys(payload).length > 0 && accessToken) {
        const response = await authorizedFetch(`${API_BASE_URL}/documents/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          throw new Error("Failed to update document")
        }
        apiDoc = mapApiDocument(await response.json())
      }

      const applyLocalUpdates = (doc: Document): Document => {
        if (doc.id !== id) return doc
        const base = apiDoc ?? doc
        const merged: Document = {
          ...base,
          ...updates,
        }

        if (updates.content !== undefined) {
          merged.content = updates.content
          merged.size = calculateDocSize(updates.content)
        }

        if (updates.status === undefined && apiDoc) {
          merged.status = apiDoc.status
        }

        merged.modifiedAt =
          apiDoc?.modifiedAt ?? (updates.title || updates.content || updates.status ? new Date() : doc.modifiedAt)

        return merged
      }

      setDocuments((prev) => prev.map(applyLocalUpdates))
      setCurrentDocument((prev) => (prev && prev.id === id ? applyLocalUpdates(prev) : prev))

      return apiDoc
    },
    [accessToken, authorizedFetch],
  )

  const deleteDocument = useCallback(
    (id: string) => updateDocument(id, { status: "trashed" }),
    [updateDocument],
  )

  const restoreDocument = useCallback(
    (id: string) => updateDocument(id, { status: "active" }),
    [updateDocument],
  )

  const starDocument = (id: string) => {
    updateDocument(id, { isStarred: true }).catch((error) =>
      console.error("Failed to star document", error),
    )
  }

  const unstarDocument = (id: string) => {
    updateDocument(id, { isStarred: false }).catch((error) =>
      console.error("Failed to unstar document", error),
    )
  }

  const shareDocument = (id: string, settings: ShareSettings) => {
    setShareSettings(settings)
    updateDocument(id, {
      isShared: settings.isPublic || settings.allowComments || settings.allowEditing,
    }).catch((error) => console.error("Failed to update share setting", error))
  }

  const addCollaborator = useCallback(
    async (documentId: string, email: string, role: "viewer" | "commenter" | "editor") => {
      if (!accessToken) throw new Error("Missing access token")
      const resp = await authorizedFetch(`${API_BASE_URL}/acl/documents/${documentId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })
      if (!resp.ok) {
        const message = await resp.text()
        throw new Error(message || "Failed to add collaborator")
      }
      const data = (await resp.json()) as { userId: string; role: string; email?: string; name?: string; avatar?: string }
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                permissions: [
                  ...doc.permissions.filter((p) => p.userId !== data.userId),
                  {
                    userId: data.userId,
                    role: data.role as any,
                    email: data.email,
                    name: data.name,
                    avatar: data.avatar,
                  },
                ],
                isShared: true,
              }
            : doc,
        ),
      )
    },
    [accessToken, authorizedFetch],
  )

  const removeCollaborator = useCallback(
    async (documentId: string, userId: string) => {
      if (!accessToken) return
      const resp = await authorizedFetch(`${API_BASE_URL}/acl/documents/${documentId}/collaborators/${userId}`, {
        method: "DELETE",
      })
      if (!resp.ok) {
        throw new Error("Failed to remove collaborator")
      }
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
    },
    [accessToken, authorizedFetch],
  )

  const updateCollaboratorRole = useCallback(
    async (documentId: string, userId: string, role: "viewer" | "commenter" | "editor") => {
      if (!accessToken) return
      const resp = await authorizedFetch(`${API_BASE_URL}/acl/documents/${documentId}/collaborators/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!resp.ok) {
        throw new Error("Failed to update collaborator role")
      }
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
    },
    [accessToken, authorizedFetch],
  )

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

  const selectDocument = useCallback(
    (id: string | null) => {
      setPreferredDocumentId(id)
      if (!id) {
        setCurrentDocument((prev) => prev ?? (documents[0] ?? null))
        return
      }
      const existing = documents.find((doc) => doc.id === id)
      if (existing) {
        setCurrentDocument(existing)
      } else {
        fetchDocumentById(id).catch((error) => console.error("Failed to load document by id", error))
      }
    },
    [documents, fetchDocumentById],
  )

  return (
    <DocumentContext.Provider
      value={{
        documents,
        currentDocument,
        shareSettings,
        searchQuery,
        accessError,
        clearAccessError: () => setAccessError(null),
        setSearchQuery,
        createDocument,
        selectDocument,
        refreshDocument,
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
