import { Request, Response } from 'express'
import { Comment, IComment } from '../models/Comment'
import { Design } from '../models/Design'
import { User } from '../models/User'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
  }
}

// Create a new comment
export const createComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { designId, content, mentions = [], position, elementId, parentId } = req.body
    const user = req.user!

    // Verify design exists and user has access
    const design = await Design.findById(designId)
    if (!design) {
      return res.status(404).json({ error: 'Design not found' })
    }

    // Validate mentions - ensure mentioned users exist
    const mentionUserIds = mentions.map((m: any) => m.userId)
    if (mentionUserIds.length > 0) {
      const mentionedUsers = await User.find({ _id: { $in: mentionUserIds } })
      if (mentionedUsers.length !== mentionUserIds.length) {
        return res.status(400).json({ error: 'One or more mentioned users not found' })
      }
    }

    // If replying to a comment, verify parent exists
    if (parentId) {
      const parentComment = await Comment.findById(parentId)
      if (!parentComment || parentComment.designId !== designId) {
        return res.status(404).json({ error: 'Parent comment not found' })
      }
    }

    const comment = new Comment({
      designId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      content,
      mentions,
      position,
      elementId,
      parentId,
      isResolved: false
    })

    await comment.save()

    // Populate comment data for response
    const populatedComment = await Comment.findById(comment._id)

    res.status(201).json({
      success: true,
      comment: populatedComment
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    res.status(500).json({ error: 'Failed to create comment' })
  }
}

// Get comments for a design
export const getComments = async (req: Request, res: Response) => {
  try {
    const { designId } = req.params
    const { resolved, elementId, parentId, page = 1, limit = 50 } = req.query

    // Build query filters
    const filters: any = { designId }
    
    if (resolved !== undefined) {
      filters.isResolved = resolved === 'true'
    }
    
    if (elementId) {
      filters.elementId = elementId
    }
    
    if (parentId) {
      filters.parentId = parentId
    } else {
      // Only get top-level comments if no parentId specified
      filters.parentId = { $exists: false }
    }

    const skip = (Number(page) - 1) * Number(limit)

    const comments = await Comment.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    // Get reply counts for top-level comments
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replyCount = await Comment.countDocuments({ parentId: comment._id })
        return {
          ...comment.toObject(),
          replyCount
        }
      })
    )

    const total = await Comment.countDocuments(filters)

    res.json({
      success: true,
      comments: commentsWithReplies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Error getting comments:', error)
    res.status(500).json({ error: 'Failed to get comments' })
  }
}

// Get replies for a comment
export const getCommentReplies = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params
    const { page = 1, limit = 20 } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const replies = await Comment.find({ parentId: commentId })
      .sort({ createdAt: 1 }) // Replies in chronological order
      .skip(skip)
      .limit(Number(limit))

    const total = await Comment.countDocuments({ parentId: commentId })

    res.json({
      success: true,
      replies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Error getting comment replies:', error)
    res.status(500).json({ error: 'Failed to get comment replies' })
  }
}

// Update a comment
export const updateComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { commentId } = req.params
    const { content, mentions = [] } = req.body
    const user = req.user!

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    // Only allow comment owner to update
    if (comment.userId !== user.id) {
      return res.status(403).json({ error: 'Not authorized to update this comment' })
    }

    // Validate mentions
    const mentionUserIds = mentions.map((m: any) => m.userId)
    if (mentionUserIds.length > 0) {
      const mentionedUsers = await User.find({ _id: { $in: mentionUserIds } })
      if (mentionedUsers.length !== mentionUserIds.length) {
        return res.status(400).json({ error: 'One or more mentioned users not found' })
      }
    }

    comment.content = content
    comment.mentions = mentions
    comment.editedAt = new Date()
    
    await comment.save()

    res.json({
      success: true,
      comment
    })
  } catch (error) {
    console.error('Error updating comment:', error)
    res.status(500).json({ error: 'Failed to update comment' })
  }
}

// Delete a comment
export const deleteComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { commentId } = req.params
    const user = req.user!

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    // Only allow comment owner to delete
    if (comment.userId !== user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' })
    }

    // Also delete all replies to this comment
    await Comment.deleteMany({ parentId: commentId })
    await comment.deleteOne()

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
}

// Resolve/unresolve a comment
export const resolveComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { commentId } = req.params
    const { isResolved } = req.body
    const user = req.user!

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    // Verify user has access to the design
    const design = await Design.findById(comment.designId)
    if (!design) {
      return res.status(404).json({ error: 'Design not found' })
    }

    comment.isResolved = isResolved
    await comment.save()

    res.json({
      success: true,
      comment
    })
  } catch (error) {
    console.error('Error resolving comment:', error)
    res.status(500).json({ error: 'Failed to resolve comment' })
  }
}

// Get user mentions for a design (for autocomplete)
export const getDesignUsers = async (req: Request, res: Response) => {
  try {
    const { designId } = req.params
    const { query = '' } = req.query

    // Get design to verify access
    const design = await Design.findById(designId)
    if (!design) {
      return res.status(404).json({ error: 'Design not found' })
    }

    // Find users who have commented on this design or match the search query
    const searchRegex = new RegExp(query as string, 'i')
    
    // Get unique users from comments on this design
    const commentUsers = await Comment.aggregate([
      { $match: { designId } },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          userEmail: { $first: '$userEmail' }
        }
      },
      {
        $match: {
          $or: [
            { userName: searchRegex },
            { userEmail: searchRegex }
          ]
        }
      },
      { $limit: 10 }
    ])

    // Also search all users if query is provided
    let allUsers = []
    if (query) {
      allUsers = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      })
      .select('_id name email')
      .limit(10)
      .lean()
    }

    // Combine and deduplicate results
    const userMap = new Map()
    
    commentUsers.forEach(user => {
      userMap.set(user._id, {
        id: user._id,
        name: user.userName,
        email: user.userEmail
      })
    })
    
    allUsers.forEach(user => {
      userMap.set(user._id.toString(), {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      })
    })

    const users = Array.from(userMap.values())

    res.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('Error getting design users:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
}
