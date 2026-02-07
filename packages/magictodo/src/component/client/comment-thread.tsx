/**
 * CommentThread Component
 * 
 * @domain magictodo
 * @layer component/client
 * @responsibility Display and manage threaded task comments
 */

"use client"

import { useState, useCallback, useMemo } from "react"
import { Button, Textarea, Avatar, AvatarFallback } from "@afenda/shadcn"
import { cn } from "@afenda/shared/utils"
import { Send, Edit3, Trash2, Reply, CornerDownRight, Loader2, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { TaskComment } from "@afenda/magictodo/zod"

export interface UserInfo {
  id: string
  name?: string
  email?: string
  avatarUrl?: string
}

export interface CommentThreadProps {
  taskId: string
  comments: TaskComment[]
  users?: Record<string, UserInfo>
  currentUserId?: string
  isLoading?: boolean
  onAddComment?: (content: string, parentCommentId?: string) => Promise<void>
  onEditComment?: (commentId: string, content: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
  readonly?: boolean
}

interface CommentNode extends TaskComment {
  replies: CommentNode[]
}

function buildCommentTree(comments: TaskComment[]): CommentNode[] {
  const commentMap = new Map<string, CommentNode>()
  const rootComments: CommentNode[] = []

  // First pass: create nodes
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  // Second pass: build tree
  comments.forEach((comment) => {
    const node = commentMap.get(comment.id)!
    if (comment.parentCommentId) {
      const parent = commentMap.get(comment.parentCommentId)
      if (parent) {
        parent.replies.push(node)
      } else {
        rootComments.push(node)
      }
    } else {
      rootComments.push(node)
    }
  })

  // Sort by date (oldest first for threads)
  const sortByDate = (a: CommentNode, b: CommentNode) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()

  rootComments.sort(sortByDate)
  commentMap.forEach((node) => node.replies.sort(sortByDate))

  return rootComments
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  if (email) {
    return email[0].toUpperCase()
  }
  return "?"
}

interface CommentItemProps {
  comment: CommentNode
  users?: Record<string, UserInfo>
  currentUserId?: string
  depth: number
  onReply?: (commentId: string) => void
  onEdit?: (commentId: string) => void
  onDelete?: (commentId: string) => void
  readonly?: boolean
}

function CommentItem({
  comment,
  users,
  currentUserId,
  depth,
  onReply,
  onEdit,
  onDelete,
  readonly,
}: CommentItemProps) {
  const user = users?.[comment.userId]
  const isOwner = currentUserId === comment.userId
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })

  return (
    <div className={cn("space-y-2", depth > 0 && "ml-6 pt-2")}>
      <div className="group flex gap-3">
        {depth > 0 && (
          <CornerDownRight className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-2" />
        )}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {getInitials(user?.name, user?.email)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium truncate">
              {user?.name ?? user?.email ?? "Unknown"}
            </span>
            <span className="text-muted-foreground text-xs">{timeAgo}</span>
            {comment.isEdited && (
              <span className="text-muted-foreground text-xs">(edited)</span>
            )}
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
          
          {/* Actions */}
          {!readonly && (
            <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onReply(comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              {isOwner && onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onEdit(comment.id)}
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              {isOwner && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies.length > 0 && (
        <div className="border-l-2 border-muted pl-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              users={users}
              currentUserId={currentUserId}
              depth={depth + 1}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              readonly={readonly}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentThread({
  taskId: _taskId,
  comments,
  users,
  currentUserId,
  isLoading = false,
  onAddComment,
  onEditComment,
  onDeleteComment,
  readonly = false,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState("")
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const commentTree = useMemo(() => buildCommentTree(comments), [comments])

  const replyingToComment = replyToId ? comments.find((c) => c.id === replyToId) : null

  const handleSubmit = useCallback(async () => {
    if (!newComment.trim() || !onAddComment) return

    setIsSubmitting(true)
    try {
      await onAddComment(newComment.trim(), replyToId ?? undefined)
      setNewComment("")
      setReplyToId(null)
    } finally {
      setIsSubmitting(false)
    }
  }, [newComment, replyToId, onAddComment])

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editingContent.trim() || !onEditComment) return

    setIsSubmitting(true)
    try {
      await onEditComment(editingId, editingContent.trim())
      setEditingId(null)
      setEditingContent("")
    } finally {
      setIsSubmitting(false)
    }
  }, [editingId, editingContent, onEditComment])

  const handleStartEdit = useCallback((commentId: string) => {
    const comment = comments.find((c) => c.id === commentId)
    if (comment) {
      setEditingId(commentId)
      setEditingContent(comment.content)
    }
  }, [comments])

  const handleDelete = useCallback(async (commentId: string) => {
    if (!onDeleteComment) return
    if (window.confirm("Delete this comment?")) {
      await onDeleteComment(commentId)
    }
  }, [onDeleteComment])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (editingId) {
        handleSaveEdit()
      } else {
        handleSubmit()
      }
    }
  }, [editingId, handleSaveEdit, handleSubmit])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading comments...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment count */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h4>
        {comments.length > 5 && (
          <Button variant="ghost" size="sm" className="h-6 text-xs">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Comment list */}
      {commentTree.length > 0 ? (
        <div className="space-y-4">
          {commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              users={users}
              currentUserId={currentUserId}
              depth={0}
              onReply={!readonly && onAddComment ? setReplyToId : undefined}
              onEdit={!readonly && onEditComment ? handleStartEdit : undefined}
              onDelete={!readonly && onDeleteComment ? handleDelete : undefined}
              readonly={readonly}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Start the conversation!
        </p>
      )}

      {/* Edit form */}
      {editingId && (
        <div className="space-y-2 p-3 rounded-md bg-muted/50">
          <div className="text-xs text-muted-foreground">Editing comment</div>
          <Textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Edit your comment..."
            className="min-h-[60px] text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingId(null)
                setEditingContent("")
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={!editingContent.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* New comment form */}
      {!readonly && !editingId && (
        <div className="space-y-2">
          {replyingToComment && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Reply className="h-3 w-3" />
              <span>
                Replying to {users?.[replyingToComment.userId]?.name ?? "comment"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-xs"
                onClick={() => setReplyToId(null)}
              >
                Cancel
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={replyToId ? "Write a reply..." : "Add a comment..."}
              className="min-h-[60px] text-sm flex-1"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Press ⌘+Enter to send
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Send className="h-3 w-3 mr-1" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
