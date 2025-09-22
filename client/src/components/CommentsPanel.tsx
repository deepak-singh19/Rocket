import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { Comment, User, CreateCommentRequest } from '../types'
import { commentService } from '../services/commentService'
import CommentItem from './CommentItem'
import MentionInput from './MentionInput'

interface CommentsPanelProps {
  designId: string
  selectedElementId?: string | null
  position?: { x: number; y: number }
  onClose: () => void
  collaboration?: {
    socket: any
    currentUser: { id: string; name: string } | null
  }
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({
  designId,
  selectedElementId,
  position,
  onClose,
  collaboration
}) => {
  const { user } = useSelector((state: RootState) => state.auth)
  
  const [comments, setComments] = useState<Comment[]>([])
  const [replies, setReplies] = useState<Record<string, Comment[]>>({})
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newCommentContent, setNewCommentContent] = useState('')
  const [newCommentMentions, setNewCommentMentions] = useState<Array<{ userId: string; userName: string; userEmail: string }>>([])
  const [showResolved, setShowResolved] = useState(false)
  const [filterBy, setFilterBy] = useState<'all' | 'unresolved' | 'resolved'>('all')

  // Load comments and users
  useEffect(() => {
    if (designId) {
      loadComments()
      loadUsers()
    }
  }, [designId, selectedElementId, filterBy])

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!collaboration?.socket) return

    const socket = collaboration.socket

    const handleCommentCreated = (data: { comment: Comment; designId: string }) => {
      if (data.designId === designId) {
        setComments(prev => [data.comment, ...prev])
      }
    }

    const handleCommentUpdated = (data: { comment: Comment; designId: string }) => {
      if (data.designId === designId) {
        setComments(prev => prev.map(c => c._id === data.comment._id ? data.comment : c))
        
        // Update in replies too
        setReplies(prev => {
          const newReplies = { ...prev }
          Object.keys(newReplies).forEach(parentId => {
            newReplies[parentId] = newReplies[parentId].map(r => 
              r._id === data.comment._id ? data.comment : r
            )
          })
          return newReplies
        })
      }
    }

    const handleCommentDeleted = (data: { commentId: string; designId: string }) => {
      if (data.designId === designId) {
        setComments(prev => prev.filter(c => c._id !== data.commentId))
        
        // Remove from replies too
        setReplies(prev => {
          const newReplies = { ...prev }
          Object.keys(newReplies).forEach(parentId => {
            newReplies[parentId] = newReplies[parentId].filter(r => r._id !== data.commentId)
          })
          return newReplies
        })
      }
    }

    const handleCommentResolved = (data: { commentId: string; isResolved: boolean; designId: string }) => {
      if (data.designId === designId) {
        setComments(prev => prev.map(c => 
          c._id === data.commentId ? { ...c, isResolved: data.isResolved } : c
        ))
      }
    }

    socket.on('comment_created', handleCommentCreated)
    socket.on('comment_updated', handleCommentUpdated)
    socket.on('comment_deleted', handleCommentDeleted)
    socket.on('comment_resolved', handleCommentResolved)

    return () => {
      socket.off('comment_created', handleCommentCreated)
      socket.off('comment_updated', handleCommentUpdated)
      socket.off('comment_deleted', handleCommentDeleted)
      socket.off('comment_resolved', handleCommentResolved)
    }
  }, [collaboration?.socket, designId])

  const loadComments = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = {
        elementId: selectedElementId || undefined,
        resolved: filterBy === 'all' ? undefined : filterBy === 'resolved'
      }

      const response = await commentService.getComments(designId, filters)
      setComments(response.data)
    } catch (err) {
      console.error('Failed to load comments:', err)
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await commentService.getDesignUsers(designId)
      setUsers(response.data)
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  const loadReplies = async (commentId: string) => {
    try {
      const response = await commentService.getCommentReplies(commentId)
      setReplies(prev => ({ ...prev, [commentId]: response.data }))
    } catch (err) {
      console.error('Failed to load replies:', err)
    }
  }

  const handleCreateComment = async () => {
    if (!newCommentContent.trim() || !user) return

    try {
      const commentData: CreateCommentRequest = {
        designId,
        content: newCommentContent.trim(),
        mentions: newCommentMentions,
        position,
        elementId: selectedElementId || undefined
      }

      const response = await commentService.createComment(commentData)
      
      // Add to local state
      setComments(prev => [response.data, ...prev])
      
      // Broadcast to other users
      if (collaboration?.socket && collaboration.currentUser) {
        collaboration.socket.emit('comment_created', {
          designId,
          comment: response.data,
          userId: collaboration.currentUser.id,
          userName: collaboration.currentUser.name
        })
      }

      // Clear form
      setNewCommentContent('')
      setNewCommentMentions([])
    } catch (err) {
      console.error('Failed to create comment:', err)
      setError('Failed to create comment')
    }
  }

  const handleUpdateComment = async (commentId: string, content: string, mentions: Array<{ userId: string; userName: string; userEmail: string }>) => {
    try {
      const response = await commentService.updateComment(commentId, { content, mentions })
      
      // Update local state
      setComments(prev => prev.map(c => c._id === commentId ? response.data : c))
      
      // Broadcast to other users
      if (collaboration?.socket && collaboration.currentUser) {
        collaboration.socket.emit('comment_updated', {
          designId,
          comment: response.data,
          userId: collaboration.currentUser.id,
          userName: collaboration.currentUser.name
        })
      }
    } catch (err) {
      console.error('Failed to update comment:', err)
      setError('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      await commentService.deleteComment(commentId)
      
      // Remove from local state
      setComments(prev => prev.filter(c => c._id !== commentId))
      
      // Broadcast to other users
      if (collaboration?.socket && collaboration.currentUser) {
        collaboration.socket.emit('comment_deleted', {
          designId,
          commentId,
          userId: collaboration.currentUser.id,
          userName: collaboration.currentUser.name
        })
      }
    } catch (err) {
      console.error('Failed to delete comment:', err)
      setError('Failed to delete comment')
    }
  }

  const handleResolveComment = async (commentId: string, isResolved: boolean) => {
    try {
      const response = await commentService.resolveComment(commentId, isResolved)
      
      // Update local state
      setComments(prev => prev.map(c => c._id === commentId ? response.data : c))
      
      // Broadcast to other users
      if (collaboration?.socket && collaboration.currentUser) {
        collaboration.socket.emit('comment_resolved', {
          designId,
          commentId,
          isResolved,
          userId: collaboration.currentUser.id,
          userName: collaboration.currentUser.name
        })
      }
    } catch (err) {
      console.error('Failed to resolve comment:', err)
      setError('Failed to resolve comment')
    }
  }

  const handleReply = async (parentId: string, content: string, mentions: Array<{ userId: string; userName: string; userEmail: string }>) => {
    if (!user) return

    try {
      const commentData: CreateCommentRequest = {
        designId,
        content: content.trim(),
        mentions,
        parentId
      }

      const response = await commentService.createComment(commentData)
      
      // Add to replies
      setReplies(prev => ({
        ...prev,
        [parentId]: [...(prev[parentId] || []), response.data]
      }))
      
      // Update parent comment reply count
      setComments(prev => prev.map(c => 
        c._id === parentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c
      ))
      
      // Broadcast to other users
      if (collaboration?.socket && collaboration.currentUser) {
        collaboration.socket.emit('comment_created', {
          designId,
          comment: response.data,
          userId: collaboration.currentUser.id,
          userName: collaboration.currentUser.name
        })
      }
    } catch (err) {
      console.error('Failed to create reply:', err)
      setError('Failed to create reply')
    }
  }

  if (!user) return null

  const filteredComments = comments.filter(comment => {
    if (filterBy === 'resolved') return comment.isResolved
    if (filterBy === 'unresolved') return !comment.isResolved
    return true
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Comments</h2>
              <p className="text-sm text-gray-500">
                {selectedElementId ? 'Element comments' : 'Canvas comments'}
                {position && ` • Position: ${Math.round(position.x)}, ${Math.round(position.y)}`}
              </p>
            </div>
            
            {/* Filter controls */}
            <div className="flex items-center space-x-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as 'all' | 'unresolved' | 'resolved')}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Comments</option>
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading comments...</span>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
              <p className="text-gray-500">Start a conversation by adding the first comment!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredComments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  currentUserId={user.id}
                  users={users}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                  onResolve={handleResolveComment}
                  onReply={handleReply}
                  onLoadReplies={loadReplies}
                  showReplies={!!replies[comment._id]}
                  replies={replies[comment._id] || []}
                />
              ))}
            </div>
          )}
        </div>

        {/* New comment form */}
        <div className="border-t border-gray-200 p-6">
          <div className="space-y-4">
            <MentionInput
              value={newCommentContent}
              onChange={(content, mentions) => {
                setNewCommentContent(content)
                setNewCommentMentions(mentions)
              }}
              users={users}
              placeholder="Add a comment... Use @ to mention someone"
              className="min-h-[100px]"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                💡 Tip: Use <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">@</kbd> to mention users, 
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">Cmd/Ctrl + Enter</kbd> to submit
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateComment}
                  disabled={!newCommentContent.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentsPanel