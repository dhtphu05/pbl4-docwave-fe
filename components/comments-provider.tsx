"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface Comment {
  id: string
  blockId: string
  selectedText: string
  content: string
  author: {
    id: string
    name: string
    avatar: string
    color: string
  }
  createdAt: Date
  status: "open" | "resolved"
  replies: Reply[]
  position?: {
    start: number
    end: number
  }
}

export interface Reply {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar: string
    color: string
  }
  createdAt: Date
}

export interface Suggestion {
  id: string
  blockId: string
  type: "insert" | "delete" | "replace"
  originalText: string
  suggestedText: string
  author: {
    id: string
    name: string
    avatar: string
    color: string
  }
  createdAt: Date
  status: "pending" | "accepted" | "rejected"
  position: {
    start: number
    end: number
  }
}

interface CommentsContextType {
  comments: Comment[]
  suggestions: Suggestion[]
  suggestionMode: boolean
  addComment: (
    blockId: string,
    selectedText: string,
    content: string,
    position?: { start: number; end: number },
  ) => void
  addReply: (commentId: string, content: string) => void
  resolveComment: (commentId: string) => void
  reopenComment: (commentId: string) => void
  deleteComment: (commentId: string) => void
  addSuggestion: (
    blockId: string,
    type: Suggestion["type"],
    originalText: string,
    suggestedText: string,
    position: { start: number; end: number },
  ) => void
  acceptSuggestion: (suggestionId: string) => void
  rejectSuggestion: (suggestionId: string) => void
  toggleSuggestionMode: () => void
  filterStatus: "all" | "open" | "resolved"
  setFilterStatus: (status: "all" | "open" | "resolved") => void
}

const CommentsContext = createContext<CommentsContextType | null>(null)

export function useComments() {
  const context = useContext(CommentsContext)
  if (!context) {
    throw new Error("useComments must be used within CommentsProvider")
  }
  return context
}

interface CommentsProviderProps {
  children: ReactNode
}

export function CommentsProvider({ children }: CommentsProviderProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      blockId: "2",
      selectedText: "collaborative rich-text editor",
      content: "This is a great description! Maybe we should add more details about the real-time features?",
      author: {
        id: "user-2",
        name: "Alice Johnson",
        avatar: "/abstract-geometric-shapes.png",
        color: "#ef4444",
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: "open",
      replies: [
        {
          id: "reply-1",
          content: "Good point! I'll add more details about the collaboration features.",
          author: {
            id: "user-1",
            name: "You",
            avatar: "/abstract-geometric-shapes.png",
            color: "#8b5cf6",
          },
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
      ],
      position: { start: 45, end: 72 },
    },
    {
      id: "2",
      blockId: "3",
      selectedText: "Share button",
      content: "Should we make this more prominent? It's a key feature.",
      author: {
        id: "user-3",
        name: "Bob Smith",
        avatar: "/abstract-geometric-shapes.png",
        color: "#10b981",
      },
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      status: "resolved",
      replies: [],
      position: { start: 120, end: 132 },
    },
  ])

  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      id: "suggestion-1",
      blockId: "1",
      type: "replace",
      originalText: "Welcome to DocWave",
      suggestedText: "Welcome to DocWave - Your Collaborative Editor",
      author: {
        id: "user-2",
        name: "Alice Johnson",
        avatar: "/abstract-geometric-shapes.png",
        color: "#ef4444",
      },
      createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      status: "pending",
      position: { start: 0, end: 19 },
    },
  ])

  const [suggestionMode, setSuggestionMode] = useState(false)
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "resolved">("all")

  const addComment = (
    blockId: string,
    selectedText: string,
    content: string,
    position?: { start: number; end: number },
  ) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      blockId,
      selectedText,
      content,
      author: {
        id: "user-1",
        name: "You",
        avatar: "/abstract-geometric-shapes.png",
        color: "#8b5cf6",
      },
      createdAt: new Date(),
      status: "open",
      replies: [],
      position,
    }
    setComments((prev) => [newComment, ...prev])
  }

  const addReply = (commentId: string, content: string) => {
    const newReply: Reply = {
      id: Date.now().toString(),
      content,
      author: {
        id: "user-1",
        name: "You",
        avatar: "/abstract-geometric-shapes.png",
        color: "#8b5cf6",
      },
      createdAt: new Date(),
    }

    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, replies: [...comment.replies, newReply] } : comment,
      ),
    )
  }

  const resolveComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) => (comment.id === commentId ? { ...comment, status: "resolved" as const } : comment)),
    )
  }

  const reopenComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) => (comment.id === commentId ? { ...comment, status: "open" as const } : comment)),
    )
  }

  const deleteComment = (commentId: string) => {
    setComments((prev) => prev.filter((comment) => comment.id !== commentId))
  }

  const addSuggestion = (
    blockId: string,
    type: Suggestion["type"],
    originalText: string,
    suggestedText: string,
    position: { start: number; end: number },
  ) => {
    const newSuggestion: Suggestion = {
      id: Date.now().toString(),
      blockId,
      type,
      originalText,
      suggestedText,
      author: {
        id: "user-1",
        name: "You",
        avatar: "/abstract-geometric-shapes.png",
        color: "#8b5cf6",
      },
      createdAt: new Date(),
      status: "pending",
      position,
    }
    setSuggestions((prev) => [newSuggestion, ...prev])
  }

  const acceptSuggestion = (suggestionId: string) => {
    setSuggestions((prev) =>
      prev.map((suggestion) =>
        suggestion.id === suggestionId ? { ...suggestion, status: "accepted" as const } : suggestion,
      ),
    )
  }

  const rejectSuggestion = (suggestionId: string) => {
    setSuggestions((prev) =>
      prev.map((suggestion) =>
        suggestion.id === suggestionId ? { ...suggestion, status: "rejected" as const } : suggestion,
      ),
    )
  }

  const toggleSuggestionMode = () => {
    setSuggestionMode((prev) => !prev)
  }

  return (
    <CommentsContext.Provider
      value={{
        comments,
        suggestions,
        suggestionMode,
        addComment,
        addReply,
        resolveComment,
        reopenComment,
        deleteComment,
        addSuggestion,
        acceptSuggestion,
        rejectSuggestion,
        toggleSuggestionMode,
        filterStatus,
        setFilterStatus,
      }}
    >
      {children}
    </CommentsContext.Provider>
  )
}
