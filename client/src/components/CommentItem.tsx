import React, { useState } from 'react'
import { Comment, User } from '../types'
import MentionInput from './MentionInput'

interface CommentItemProps {
  comment: Comment
  currentUserId: string
  users: User[]
  onUpdate?: (commentId: string, content: string, mentions: Array<{ userId: string; userName: string; userEmail: string }>) => void
  onDelete?: (commentId: string) => void
  onResolve?: (commentId: string, isResolved: boolean) => void
  onReply?: (parentId: string, content: string, mentions: Array<{ userId: string; userName: string; userEmail: string }>) => void
  onLoadReplies?: (commentId: string) => void
  showReplies?: boolean
  replies?: Comment[]
  isReply?: boolean
  className?: string
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  users,
  onUpdate,
  onDelete,
  onResolve,
  onReply,
  onLoadReplies,
  showReplies = false,
  replies = [],
  isReply = false,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [editMentions, setEditMentions] = useState(comment.mentions)
  const [replyContent, setReplyContent] = useState('')
  const [replyMentions, setReplyMentions] = useState<Array<{ userId: string; userName: string; userEmail: string }>>([])

  const isAuthor = comment.userId === currentUserId
  const canEdit = isAuthor
  const canDelete = isAuthor

  // Render content with highlighted mentions
  const renderContent = (content: string) => {
    const mentionRegex = /@\[([^\]]+)\]\([^)]+\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }
      
      // Add mention
      const [fullMatch, userName] = match
      parts.push(
        <span 
          key={match.index} 
          className="bg-blue-100 text-blue-800 px-1 rounded font-medium"
        >
          @{userName}
        </span>
      )
      
      lastIndex = match.index + fullMatch.length
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }
    
    return parts.length > 0 ? parts : content
  }

  const handleSaveEdit = () => {
    if (editContent.trim() && onUpdate) {
      onUpdate(comment._id, editContent.trim(), editMentions)
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditContent(comment.content)
    setEditMentions(comment.mentions)
    setIsEditing(false)
  }

  const handleSubmitReply = () => {
    if (replyContent.trim() && onReply) {
      onReply(comment._id, replyContent.trim(), replyMentions)
      setReplyContent('')
      setReplyMentions([])
      setIsReplying(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${comment.isResolved ? 'opacity-60' : ''} ${className}`}>
      {/* Comment header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {comment.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {comment.userName}
            </div>
            <div className="text-xs text-gray-500">
              {formatTimeAgo(comment.createdAt)}
              {comment.editedAt && ' (edited)'}
            </div>
          </div>
        </div>
        
        {/* Status and actions */}
        <div className="flex items-center space-x-2">
          {comment.isResolved && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Resolved
            </span>
          )}
          
          {comment.position && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              📍 Canvas
            </span>
          )}

          {/* Dropdown menu */}
          <div className="relative group">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <span>✏️</span>
                  <span>Edit</span>
                </button>
              )}
              
              {!isReply && (
                <button
                  onClick={() => setIsReplying(true)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <span>💬</span>
                  <span>Reply</span>
                </button>
              )}
              
              {onResolve && (
                <button
                  onClick={() => onResolve(comment._id, !comment.isResolved)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <span>{comment.isResolved ? '🔄' : '✅'}</span>
                  <span>{comment.isResolved ? 'Reopen' : 'Resolve'}</span>
                </button>
              )}
              
              {canDelete && (
                <button
                  onClick={() => onDelete?.(comment._id)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comment content */}
      {isEditing ? (
        <div className="space-y-3">
          <MentionInput
            value={editContent}
            onChange={(content, mentions) => {
              setEditContent(content)
              setEditMentions(mentions)
            }}
            users={users}
            placeholder="Edit your comment..."
            autoFocus
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 text-gray-600 text-sm rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
          {renderContent(comment.content)}
        </div>
      )}

      {/* Reply form */}
      {isReplying && (
        <div className="mt-4 space-y-3 border-t pt-4">
          <MentionInput
            value={replyContent}
            onChange={(content, mentions) => {
              setReplyContent(content)
              setReplyMentions(mentions)
            }}
            users={users}
            placeholder="Write a reply..."
            autoFocus
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSubmitReply}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Reply
            </button>
            <button
              onClick={() => setIsReplying(false)}
              className="px-3 py-1 text-gray-600 text-sm rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Replies section */}
      {!isReply && comment.replyCount && comment.replyCount > 0 && (
        <div className="mt-4 border-t pt-4">
          {!showReplies ? (
            <button
              onClick={() => onLoadReplies?.(comment._id)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Show {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-900">
                {comment.replyCount} {comment.replyCount === 1 ? 'Reply' : 'Replies'}
              </div>
              {replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  currentUserId={currentUserId}
                  users={users}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  isReply={true}
                  className="ml-4 border-l-2 border-gray-100 pl-4"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CommentItem
