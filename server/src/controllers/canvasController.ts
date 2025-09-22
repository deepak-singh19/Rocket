import { Request, Response } from 'express'
import { Design, IDesign } from '../models/Design.js'
import { IUser } from '../models/User.js'
import mongoose from 'mongoose'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser
    }
  }
}

export class DesignController {
  // GET /api/designs - List designs with pagination and filtering
  getDesigns = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, search, createdBy, sortBy, sortOrder } = req.query as any
      
      // Build query
      const query: any = {}
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } }
        ]
      }
      
      if (createdBy) {
        query.createdBy = createdBy
      }

      // Build sort object
      const sort: any = {}
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1

      // Calculate pagination
      const skip = (page - 1) * limit

      // Execute query
      const [designs, total] = await Promise.all([
        Design.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Design.countDocuments(query)
      ])

      res.json({
        success: true,
        data: designs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch designs',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // GET /api/designs/:id - Get design by ID
  getDesignById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          code: 'INVALID_ID',
          message: 'Invalid design ID format',
          details: 'Design ID must be a valid MongoDB ObjectId'
        })
        return
      }

      const design = await Design.findById(id).lean()

      if (!design) {
        res.status(404).json({
          code: 'DESIGN_NOT_FOUND',
          message: 'Design not found',
          details: `No design found with ID: ${id}`
        })
        return
      }

      res.json({
        success: true,
        data: design
      })
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch design',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // POST /api/designs - Create new design
  createDesign = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: 'Please provide a valid access token'
        })
        return
      }

      const designData = {
        ...req.body,
        createdBy: req.user._id
      }

      const design = new Design(designData)
      await design.save()

      res.status(201).json({
        success: true,
        data: design.toObject()
      })
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid design data',
          details: Object.values(error.errors).map(err => err.message)
        })
        return
      }

      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to create design',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // PUT /api/designs/:id - Update design
  updateDesign = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const updateData = req.body

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          code: 'INVALID_ID',
          message: 'Invalid design ID format',
          details: 'Design ID must be a valid MongoDB ObjectId'
        })
        return
      }

      const design = await Design.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).lean()

      if (!design) {
        res.status(404).json({
          code: 'DESIGN_NOT_FOUND',
          message: 'Design not found',
          details: `No design found with ID: ${id}`
        })
        return
      }

      res.json({
        success: true,
        data: design
      })
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid design data',
          details: Object.values(error.errors).map(err => err.message)
        })
        return
      }

      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to update design',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // DELETE /api/designs/:id - Delete design
  deleteDesign = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          code: 'INVALID_ID',
          message: 'Invalid design ID format',
          details: 'Design ID must be a valid MongoDB ObjectId'
        })
        return
      }

      const design = await Design.findByIdAndDelete(id).lean()

      if (!design) {
        res.status(404).json({
          code: 'DESIGN_NOT_FOUND',
          message: 'Design not found',
          details: `No design found with ID: ${id}`
        })
        return
      }

      res.json({
        success: true,
        message: 'Design deleted successfully',
        data: { id: design._id }
      })
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete design',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // POST /api/designs/:id/comments - Add comment to design
  addComment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { text, mentions, elementId } = req.body

      if (!req.user) {
        res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: 'Please provide a valid access token'
        })
        return
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          code: 'INVALID_ID',
          message: 'Invalid design ID format',
          details: 'Design ID must be a valid MongoDB ObjectId'
        })
        return
      }

      const design = await Design.findByIdAndUpdate(
        id,
        {
          $push: {
            comments: {
              author: req.user.name,
              authorId: req.user._id,
              text,
              mentions: mentions || [],
              elementId: elementId || undefined,
              createdAt: new Date()
            }
          },
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).lean()

      if (!design) {
        res.status(404).json({
          code: 'DESIGN_NOT_FOUND',
          message: 'Design not found',
          details: `No design found with ID: ${id}`
        })
        return
      }

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: {
          designId: design._id,
          comment: design.comments[design.comments.length - 1]
        }
      })
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid comment data',
          details: Object.values(error.errors).map(err => err.message)
        })
        return
      }

      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to add comment',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // GET /api/designs/:id/comments - Get comments for design
  getComments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          code: 'INVALID_ID',
          message: 'Invalid design ID format',
          details: 'Design ID must be a valid MongoDB ObjectId'
        })
        return
      }

      const design = await Design.findById(id)
        .select('comments')
        .lean()

      if (!design) {
        res.status(404).json({
          code: 'DESIGN_NOT_FOUND',
          message: 'Design not found',
          details: `No design found with ID: ${id}`
        })
        return
      }

      res.json({
        success: true,
        data: {
          designId: design._id,
          comments: design.comments
        }
      })
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch comments',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // PUT /api/designs/:id/save - Save design content (for autosave and manual save)
  saveDesign = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { elements, layers, thumbnail } = req.body

      if (!mongoose.Types.ObjectId.isValid(id)) {

        res.status(400).json({
          code: 'INVALID_ID',
          message: 'Invalid design ID format',
          details: 'Design ID must be a valid MongoDB ObjectId'
        })
        return
      }

      // Validate elements structure
      if (!elements || !elements.canvas || !Array.isArray(elements.objects)) {

        res.status(400).json({
          code: 'INVALID_ELEMENTS',
          message: 'Invalid elements structure',
          details: 'Elements must contain canvas and objects properties'
        })
        return
      }

      const updateData: any = {
        elements,
        updatedAt: new Date()
      }

      if (layers) updateData.layers = layers
      if (thumbnail) updateData.thumbnail = thumbnail

      const design = await Design.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).lean()

      if (!design) {

        res.status(404).json({
          code: 'DESIGN_NOT_FOUND',
          message: 'Design not found',
          details: `No design found with ID: ${id}`
        })
        return
      }

      res.json({
        success: true,
        message: 'Design saved successfully',
        data: {
          id: design._id,
          updatedAt: design.updatedAt,
          elementsCount: elements.objects.length
        }
      })
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid design data',
          details: Object.values(error.errors).map(err => err.message)
        })
        return
      }

      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to save design',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // GET /api/designs/:id/sync - Get full design state for synchronization
  syncDesign = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { clientVersion, lastSyncAt } = req.query

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          code: 'INVALID_ID',
          message: 'Invalid design ID format',
          details: 'Design ID must be a valid MongoDB ObjectId'
        })
        return
      }

      const design = await Design.findById(id).lean()

      if (!design) {
        res.status(404).json({
          code: 'DESIGN_NOT_FOUND',
          message: 'Design not found',
          details: `No design found with ID: ${id}`
        })
        return
      }

      // Check if client needs full sync
      const serverVersion = design.version || 1
      const clientVersionNum = clientVersion ? parseInt(clientVersion as string) : 0
      const needsFullSync = clientVersionNum < serverVersion

      // Prepare sync response
      const syncResponse = {
        success: true,
        data: {
          designId: design._id,
          version: serverVersion,
          lastSyncAt: design.lastSyncAt || design.updatedAt,
          needsFullSync,
          design: needsFullSync ? {
            id: design._id,
            name: design.name,
            width: design.width,
            height: design.height,
            createdBy: design.createdBy,
            updatedAt: design.updatedAt,
            elements: design.elements,
            layers: design.layers,
            thumbnail: design.thumbnail
          } : null,
          // Include element versions for conflict resolution
          elementVersions: design.elements?.objects?.map((element: any) => ({
            id: element.id,
            version: element.version || 1,
            lastModified: element.lastModified || design.updatedAt
          })) || []
        }
      }

      res.json(syncResponse)
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to sync design',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // DELETE /api/designs/:id/comments/:commentId - Delete comment
  deleteComment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, commentId } = req.params

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          code: 'INVALID_ID',
          message: 'Invalid design ID format',
          details: 'Design ID must be a valid MongoDB ObjectId'
        })
        return
      }

      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        res.status(400).json({
          code: 'INVALID_COMMENT_ID',
          message: 'Invalid comment ID format',
          details: 'Comment ID must be a valid MongoDB ObjectId'
        })
        return
      }

      const design = await Design.findByIdAndUpdate(
        id,
        {
          $pull: {
            comments: { _id: commentId }
          },
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).lean()

      if (!design) {
        res.status(404).json({
          code: 'DESIGN_NOT_FOUND',
          message: 'Design not found',
          details: `No design found with ID: ${id}`
        })
        return
      }

      res.json({
        success: true,
        message: 'Comment deleted successfully',
        data: {
          designId: design._id,
          commentId
        }
      })
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete comment',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // POST /api/designs/:id/thumbnail - Update design thumbnail
  updateThumbnail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { thumbnail } = req.body

      // Validate design ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          code: 'INVALID_DESIGN_ID',
          message: 'Invalid design ID format',
          details: 'Design ID must be a valid MongoDB ObjectId'
        })
        return
      }

      // Validate thumbnail data
      if (!thumbnail || typeof thumbnail !== 'string') {
        res.status(400).json({
          code: 'INVALID_THUMBNAIL',
          message: 'Invalid thumbnail data',
          details: 'Thumbnail must be a base64 encoded string'
        })
        return
      }

      // Validate base64 format
      if (!thumbnail.startsWith('data:image/png;base64,')) {
        res.status(400).json({
          code: 'INVALID_THUMBNAIL_FORMAT',
          message: 'Invalid thumbnail format',
          details: 'Thumbnail must be a base64 encoded PNG image'
        })
        return
      }

      // Check thumbnail size (max 1MB)
      const base64Data = thumbnail.split(',')[1]
      if (!base64Data) {
        res.status(400).json({
          code: 'INVALID_THUMBNAIL_FORMAT',
          message: 'Invalid thumbnail format',
          details: 'Thumbnail must be a base64 encoded PNG image'
        })
        return
      }
      const sizeInBytes = (base64Data.length * 3) / 4
      const maxSize = 1024 * 1024 // 1MB

      if (sizeInBytes > maxSize) {
        res.status(400).json({
          code: 'THUMBNAIL_TOO_LARGE',
          message: 'Thumbnail too large',
          details: `Thumbnail size (${Math.round(sizeInBytes / 1024)}KB) exceeds maximum allowed size (${maxSize / 1024}KB)`
        })
        return
      }

      // Update design thumbnail
      const design = await Design.findByIdAndUpdate(
        id,
        {
          thumbnail,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).lean()

      if (!design) {
        res.status(404).json({
          code: 'DESIGN_NOT_FOUND',
          message: 'Design not found',
          details: `No design found with ID: ${id}`
        })
        return
      }

      res.json({
        success: true,
        message: 'Thumbnail updated successfully',
        data: {
          designId: design._id,
          thumbnail: design.thumbnail,
          updatedAt: design.updatedAt
        }
      })
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to update thumbnail',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
