import mongoose, { Document, Schema } from 'mongoose'

export interface IComment extends Document {
  _id: string
  designId: string
  userId: string
  userName: string
  userEmail: string
  content: string
  mentions: Array<{
    userId: string
    userName: string
    userEmail: string
  }>
  position?: {
    x: number
    y: number
  }
  elementId?: string // If comment is attached to a specific element
  parentId?: string // For threaded replies
  isResolved: boolean
  createdAt: Date
  updatedAt: Date
  editedAt?: Date
}

const CommentSchema = new Schema<IComment>({
  designId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  mentions: [{
    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userEmail: {
      type: String,
      required: true
    }
  }],
  position: {
    x: {
      type: Number,
      min: 0
    },
    y: {
      type: Number,
      min: 0
    }
  },
  elementId: {
    type: String,
    index: true
  },
  parentId: {
    type: String,
    index: true
  },
  isResolved: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
CommentSchema.index({ designId: 1, createdAt: -1 })
CommentSchema.index({ designId: 1, isResolved: 1 })
CommentSchema.index({ designId: 1, elementId: 1 })
CommentSchema.index({ parentId: 1, createdAt: 1 })
CommentSchema.index({ 'mentions.userId': 1, createdAt: -1 })

export const Comment = mongoose.model<IComment>('Comment', CommentSchema)
