import mongoose, { Document, Schema } from 'mongoose'

export interface IComment {
  author: string
  text: string
  mentions: string[]
  createdAt: Date
  elementId?: string // Optional - if present, comment is attached to specific element
}

export interface ILayer {
  name: string
  order: number
}

export interface IDesign extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  width: number
  height: number
  createdBy: string
  updatedAt: Date
  elements: any // JSON blob for canvas elements
  layers: ILayer[]
  comments: IComment[]
  thumbnail?: string
  version: number // Design version for conflict resolution
  lastSyncAt?: Date // Last time design was synced
}

const CommentSchema = new Schema<IComment>({
  author: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  mentions: [{
    type: String,
    trim: true
  }],
  elementId: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: true
})

const LayerSchema = new Schema<ILayer>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  _id: false
})

const DesignSchema = new Schema<IDesign>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  width: {
    type: Number,
    required: true,
    min: 100,
    max: 4000
  },
  height: {
    type: Number,
    required: true,
    min: 100,
    max: 4000
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  elements: {
    type: Schema.Types.Mixed,
    default: {}
  },
  layers: [LayerSchema],
  comments: [CommentSchema],
  thumbnail: {
    type: String,
    trim: true
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  lastSyncAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false
})

// Index for better query performance
DesignSchema.index({ createdBy: 1, updatedAt: -1 })
DesignSchema.index({ name: 'text' })

// Pre-save middleware to update updatedAt and version
DesignSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  this.lastSyncAt = new Date()
  
  // Increment version if this is an update (not a new document)
  if (!this.isNew) {
    this.version = (this.version || 1) + 1
  }
  
  next()
})

// Pre-update middleware to update updatedAt, version, and lastSyncAt
DesignSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  const now = new Date()
  this.set({ 
    updatedAt: now,
    lastSyncAt: now,
    $inc: { version: 1 }
  })
  next()
})

export const Design = mongoose.model<IDesign>('Design', DesignSchema)
