import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { Comment, User } from '../types'
import { commentService } from '../services/commentService'

interface UseCommentsOptions {
  designId: string
  collaboration?: {
    socket: any
    currentUser: { id: string; name: string } | null
  }
}

interface UseCommentsReturn {
  comments: Comment[]
  users: User[]
  loading: boolean
  error: string | null
  getCommentsAtPosition: (x: number, y: number, tolerance?: number) => Comment[]
  getCommentsForElement: (elementId: string) => Comment[]
  createComment: (content: string, mentions: Array<{ userId: string; userName: string; userEmail: string }>, position?: { x: number; y: number }, elementId?: string) => Promise<Comment | null>
  updateComment: (commentId: string, content: string, mentions: Array<{ userId: string; userName: string; userEmail: string }>) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  resolveComment: (commentId: string, isResolved: boolean) => Promise<void>
  refreshComments: () => Promise<void>
}

export const useComments = ({ designId, collaboration }: UseCommentsOptions): UseCommentsReturn => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [comments, setComments] = useState<Comment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load comments and users
  const refreshComments = useCallback(async () => {
    if (!designId) return

    try {
      setLoading(true)
      setError(null)

      const [commentsResponse, usersResponse] = await Promise.all([
        commentService.getComments(designId),
        commentService.getDesignUsers(designId)
      ])

      setComments(commentsResponse.data)
      setUsers(usersResponse.data)
    } catch (err) {
      console.error('Failed to load comments:', err)
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [designId])

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
      }
    }

    const handleCommentDeleted = (data: { commentId: string; designId: string }) => {
      if (data.designId === designId) {
        setComments(prev => prev.filter(c => c._id !== data.commentId))
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

  // Initial load
  useEffect(() => {
    refreshComments()
  }, [refreshComments])

  // Get comments at a specific position
  const getCommentsAtPosition = useCallback((x: number, y: number, tolerance = 50): Comment[] => {
    return comments.filter(comment => {
      if (!comment.position) return false
      const dx = Math.abs(comment.position.x - x)
      const dy = Math.abs(comment.position.y - y)
      return dx <= tolerance && dy <= tolerance
    })
  }, [comments])

  // Get comments for a specific element
  const getCommentsForElement = useCallback((elementId: string): Comment[] => {
    return comments.filter(comment => comment.elementId === elementId)
  }, [comments])

  // Create a new comment
  const createComment = useCallback(async (
    content: string, 
    mentions: Array<{ userId: string; userName: string; userEmail: string }>, 
    position?: { x: number; y: number }, 
    elementId?: string
  ): Promise<Comment | null> => {
    if (!user) return null

    try {
      const response = await commentService.createComment({
        designId,
        content: content.trim(),
        mentions,
        position,
        elementId
      })

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

      return response.data
    } catch (err) {
      console.error('Failed to create comment:', err)
      setError('Failed to create comment')
      return null
    }
  }, [designId, user, collaboration])

  // Update a comment
  const updateComment = useCallback(async (
    commentId: string, 
    content: string, 
    mentions: Array<{ userId: string; userName: string; userEmail: string }>
  ): Promise<void> => {
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
  }, [designId, collaboration])

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string): Promise<void> => {
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
  }, [designId, collaboration])

  // Resolve/unresolve a comment
  const resolveComment = useCallback(async (commentId: string, isResolved: boolean): Promise<void> => {
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
  }, [designId, collaboration])

  return {
    comments,
    users,
    loading,
    error,
    getCommentsAtPosition,
    getCommentsForElement,
    createComment,
    updateComment,
    deleteComment,
    resolveComment,
    refreshComments
  }
}
