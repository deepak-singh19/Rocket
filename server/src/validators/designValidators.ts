import { z } from 'zod'

// Canvas element validation schema
const canvasElementSchema = z.object({
  id: z.string().min(1, 'Element ID is required'),
  type: z.enum(['rect', 'circle', 'text', 'image', 'line', 'path'], {
    errorMap: () => ({ message: 'Invalid element type' })
  }),
  x: z.number().finite('X position must be a valid number'),
  y: z.number().finite('Y position must be a valid number'),
  width: z.number().positive('Width must be positive').optional(),
  height: z.number().positive('Height must be positive').optional(),
  radius: z.number().positive('Radius must be positive').optional(),
  text: z.string().optional(),
  fontSize: z.number().positive('Font size must be positive').optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.enum(['normal', 'bold']).optional(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0, 'Stroke width must be non-negative').optional(),
  opacity: z.number().min(0, 'Opacity must be between 0 and 1').max(1, 'Opacity must be between 0 and 1').optional(),
  rotation: z.number().finite('Rotation must be a valid number').optional(),
  scaleX: z.number().positive('ScaleX must be positive').optional(),
  scaleY: z.number().positive('ScaleY must be positive').optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  src: z.string().url('Image source must be a valid URL').optional(),
  borderRadius: z.number().min(0, 'Border radius must be non-negative').optional(),
  fitMode: z.enum(['cover', 'contain']).optional(),
  data: z.record(z.any()).optional()
})

// Design elements structure validation
const designElementsSchema = z.object({
  canvas: z.object({
    width: z.number().positive('Canvas width must be positive'),
    height: z.number().positive('Canvas height must be positive'),
    backgroundColor: z.string().optional()
  }),
  objects: z.array(canvasElementSchema)
})

// Base schemas for reusable validation
const layerSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  order: z.number().int().min(0)
})

const commentSchema = z.object({
  author: z.string().min(1).max(50).trim(),
  text: z.string().min(1).max(1000).trim(),
  mentions: z.array(z.string().trim()).optional().default([])
})

// Auth validation
export const loginSchema = z.object({
  username: z.string().min(1).max(50).trim(),
  password: z.string().min(1).max(100)
})

// Design validation schemas
export const createDesignSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  width: z.number().int().min(100).max(4000),
  height: z.number().int().min(100).max(4000),
  createdBy: z.string().min(1).max(50).trim(),
  elements: designElementsSchema.optional().default({
    canvas: { width: 1080, height: 1080, backgroundColor: '#ffffff' },
    objects: []
  }),
  layers: z.array(layerSchema).optional().default([]),
  thumbnail: z.string().trim().optional()
})

export const updateDesignSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  width: z.number().int().min(100).max(4000).optional(),
  height: z.number().int().min(100).max(4000).optional(),
  elements: designElementsSchema.optional(),
  layers: z.array(layerSchema).optional(),
  thumbnail: z.string().trim().optional()
})

// Save design schema (for autosave and manual save)
export const saveDesignSchema = z.object({
  elements: designElementsSchema,
  layers: z.array(layerSchema).optional(),
  thumbnail: z.string().trim().optional()
})

export const addCommentSchema = z.object({
  author: z.string().min(1).max(50).trim(),
  text: z.string().min(1).max(1000).trim(),
  mentions: z.array(z.string().trim()).optional().default([])
})

// Query parameter validation
export const designQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
  search: z.string().trim().optional(),
  createdBy: z.string().trim().optional(),
  sortBy: z.enum(['name', 'updatedAt', 'createdAt']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// Params validation
export const designParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId')
})

export const thumbnailSchema = z.object({
  thumbnail: z.string()
    .min(1, 'Thumbnail data is required')
    .refine(
      (data: string) => data.startsWith('data:image/png;base64,'),
      'Thumbnail must be a base64 encoded PNG image'
    )
    .refine(
      (data: string) => {
        const base64Data = data.split(',')[1]
        if (!base64Data) return false
        const sizeInBytes = (base64Data.length * 3) / 4
        const maxSize = 1024 * 1024 // 1MB
        return sizeInBytes <= maxSize
      },
      'Thumbnail size must not exceed 1MB'
    )
})

// Type exports for TypeScript
export type LoginInput = z.infer<typeof loginSchema>
export type CreateDesignInput = z.infer<typeof createDesignSchema>
export type UpdateDesignInput = z.infer<typeof updateDesignSchema>
export type SaveDesignInput = z.infer<typeof saveDesignSchema>
export type AddCommentInput = z.infer<typeof addCommentSchema>
export type DesignQueryParams = z.infer<typeof designQuerySchema>
export type DesignParams = z.infer<typeof designParamsSchema>
export type ThumbnailInput = z.infer<typeof thumbnailSchema>
export type CanvasElement = z.infer<typeof canvasElementSchema>
export type DesignElements = z.infer<typeof designElementsSchema>

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        })
      }
      next(error)
    }
  }
}

// Query validation middleware
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.query = schema.parse(req.query)
      next()
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        })
      }
      next(error)
    }
  }
}

// Params validation middleware
export const validateParams = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.params = schema.parse(req.params)
      next()
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid URL parameters',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        })
      }
      next(error)
    }
  }
}
