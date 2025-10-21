"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useComments, type Comment, type Suggestion } from "./comments-provider"
import { MessageSquare, Check, X, MoreHorizontal, ReplyIcon, Trash2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface CommentItemProps {
  comment: Comment
}

function CommentItem({ comment }: CommentItemProps) {
  const { addReply, resolveComment, reopenComment, deleteComment } = useComments()
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")

  const handleReply = () => {
    if (replyContent.trim()) {
      addReply(comment.id, replyContent)
      setReplyContent("")
      setIsReplying(false)
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div
      className={cn(
        "border rounded-lg p-3 space-y-3",
        comment.status === "resolved" ? "bg-muted/50 border-muted" : "bg-background border-border",
      )}
    >
      {/* Comment header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
            <AvatarFallback style={{ backgroundColor: comment.author.color, color: "white" }}>
              {comment.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="text-sm font-medium text-popover-foreground">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground ml-2">{formatTime(comment.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant={comment.status === "resolved" ? "secondary" : "outline"} className="text-xs">
            {comment.status}
          </Badge>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Selected text */}
      {comment.selectedText && (
        <div className="bg-muted p-2 rounded text-sm">
          <span className="text-muted-foreground">&quot;</span>
          <span className="italic">{comment.selectedText}</span>
          <span className="text-muted-foreground">&quot;</span>
        </div>
      )}

      {/* Comment content */}
      <p className="text-sm text-popover-foreground">{comment.content}</p>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-2 pl-4 border-l-2 border-muted">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={reply.author.avatar || "/placeholder.svg"} />
                <AvatarFallback style={{ backgroundColor: reply.author.color, color: "white" }}>
                  {reply.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-popover-foreground">{reply.author.name}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(reply.createdAt)}</span>
                </div>
                <p className="text-xs text-popover-foreground mt-1">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {isReplying && (
        <div className="space-y-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleReply}>
              Reply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)} className="text-xs">
          <ReplyIcon className="h-3 w-3 mr-1" />
          Reply
        </Button>
        {comment.status === "open" ? (
          <Button variant="ghost" size="sm" onClick={() => resolveComment(comment.id)} className="text-xs">
            <Check className="h-3 w-3 mr-1" />
            Resolve
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => reopenComment(comment.id)} className="text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />
            Reopen
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteComment(comment.id)}
          className="text-xs text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  )
}

interface SuggestionItemProps {
  suggestion: Suggestion
}

function SuggestionItem({ suggestion }: SuggestionItemProps) {
  const { acceptSuggestion, rejectSuggestion } = useComments()

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getActionText = () => {
    switch (suggestion.type) {
      case "insert":
        return "suggested adding"
      case "delete":
        return "suggested deleting"
      case "replace":
        return "suggested changing"
      default:
        return "suggested"
    }
  }

  return (
    <div
      className={cn(
        "border rounded-lg p-3 space-y-3",
        suggestion.status === "accepted"
          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          : suggestion.status === "rejected"
            ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
            : "bg-background border-border",
      )}
    >
      {/* Suggestion header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={suggestion.author.avatar || "/placeholder.svg"} />
            <AvatarFallback style={{ backgroundColor: suggestion.author.color, color: "white" }}>
              {suggestion.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="text-sm font-medium text-popover-foreground">{suggestion.author.name}</span>
            <span className="text-xs text-muted-foreground ml-1">{getActionText()}</span>
            <span className="text-xs text-muted-foreground ml-2">{formatTime(suggestion.createdAt)}</span>
          </div>
        </div>
        <Badge
          variant={
            suggestion.status === "accepted" ? "default" : suggestion.status === "rejected" ? "destructive" : "outline"
          }
          className="text-xs"
        >
          {suggestion.status}
        </Badge>
      </div>

      {/* Suggestion content */}
      <div className="space-y-2">
        {suggestion.type === "delete" && (
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm">
            <span className="line-through text-red-600 dark:text-red-400">{suggestion.originalText}</span>
          </div>
        )}
        {suggestion.type === "insert" && (
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm">
            <span className="text-green-600 dark:text-green-400">{suggestion.suggestedText}</span>
          </div>
        )}
        {suggestion.type === "replace" && (
          <div className="space-y-1">
            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm">
              <span className="line-through text-red-600 dark:text-red-400">{suggestion.originalText}</span>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm">
              <span className="text-green-600 dark:text-green-400">{suggestion.suggestedText}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {suggestion.status === "pending" && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button size="sm" onClick={() => acceptSuggestion(suggestion.id)} className="bg-green-600 hover:bg-green-700">
            <Check className="h-3 w-3 mr-1" />
            Accept
          </Button>
          <Button size="sm" variant="destructive" onClick={() => rejectSuggestion(suggestion.id)}>
            <X className="h-3 w-3 mr-1" />
            Reject
          </Button>
        </div>
      )}
    </div>
  )
}

export function CommentsPanel() {
  const { comments, suggestions, suggestionMode, toggleSuggestionMode, filterStatus, setFilterStatus } = useComments()

  const [activeTab, setActiveTab] = useState<"comments" | "suggestions">("comments")

  const filteredComments = comments.filter((comment) => {
    if (filterStatus === "all") return true
    return comment.status === filterStatus
  })

  const pendingSuggestions = suggestions.filter((s) => s.status === "pending")

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "comments" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("comments")}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Comments ({filteredComments.length})
            </Button>
            <Button
              variant={activeTab === "suggestions" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("suggestions")}
            >
              Suggestions ({pendingSuggestions.length})
            </Button>
          </div>
          <Button
            variant={suggestionMode ? "default" : "ghost"}
            size="sm"
            onClick={toggleSuggestionMode}
            className={suggestionMode ? "bg-primary" : ""}
          >
            Suggest
          </Button>
        </div>

        {activeTab === "comments" && (
          <Select value={filterStatus} onValueChange={(value: "all" | "open" | "resolved") => setFilterStatus(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Comments</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "comments" ? (
          <div className="space-y-4">
            {filteredComments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {filterStatus === "all"
                    ? "No comments yet. Select text and add a comment to start collaborating."
                    : `No ${filterStatus} comments.`}
                </p>
              </div>
            ) : (
              filteredComments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No suggestions yet. Enable suggestion mode to start tracking changes.
                </p>
              </div>
            ) : (
              suggestions.map((suggestion) => <SuggestionItem key={suggestion.id} suggestion={suggestion} />)
            )}
          </div>
        )}
      </div>
    </div>
  )
}
