import { z } from 'zod'
import validator from 'validator'
import sanitizeHtml from 'sanitize-html'

// Security configuration
const SECURITY_CONFIG = {
  MAX_STRING_LENGTH: 1000,
  MAX_ELEMENT_COUNT: 1000,
  MAX_CANVAS_SIZE: 4000,
  MIN_CANVAS_SIZE: 100,
  MAX_COMMENT_LENGTH: 1000,
  MAX_USERNAME_LENGTH: 50,
  MAX_DESIGN_NAME_LENGTH: 100,
  ALLOWED_IMAGE_DOMAINS: [
    'https://images.unsplash.com',
    'https://picsum.photos',
    'https://via.placeholder.com',
    'https://source.unsplash.com'
  ],
  ALLOWED_PROTOCOLS: ['https:', 'data:'],
  MAX_THUMBNAIL_SIZE: 1024 * 1024, // 1MB
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
}

// Custom sanitization functions
const sanitizeString = (str: string): string => {
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  }).trim()
}

const sanitizeUrl = (url: string): string => {
  // Remove any potential XSS or injection attempts
  const cleaned = sanitizeString(url)
  
  // Validate URL format
  if (!validator.isURL(cleaned, { 
    protocols: SECURITY_CONFIG.ALLOWED_PROTOCOLS,
    require_protocol: true 
  })) {
    throw new Error('Invalid URL format')
  }
  
  // For data URLs, validate base64 format
  if (cleaned.startsWith('data:')) {
    if (!cleaned.startsWith('data:image/png;base64,') && 
        !cleaned.startsWith('data:image/jpeg;base64,')) {
      throw new Error('Only PNG and JPEG images are allowed')
    }
    
    const base64Data = cleaned.split(',')[1]
    if (!base64Data || !validator.isBase64(base64Data)) {
      throw new Error('Invalid base64 data')
    }
    
    // Check size
    const sizeInBytes = (base64Data.length * 3) / 4
    if (sizeInBytes > SECURITY_CONFIG.MAX_THUMBNAIL_SIZE) {
      throw new Error('Image size exceeds maximum allowed')
    }
  }
  
  // For HTTP URLs, check allowed domains
  if (cleaned.startsWith('http')) {
    const urlObj = new URL(cleaned)
    const isAllowedDomain = SECURITY_CONFIG.ALLOWED_IMAGE_DOMAINS.some(domain => 
      cleaned.startsWith(domain)
    )
    
    if (!isAllowedDomain) {
      throw new Error('Image URL domain not allowed')
    }
  }
  
  return cleaned
}

const sanitizeObjectId = (id: string): string => {
  const cleaned = sanitizeString(id)
  if (!validator.isMongoId(cleaned)) {
    throw new Error('Invalid MongoDB ObjectId format')
  }
  return cleaned
}

// Enhanced Zod schemas with security validation
const secureStringSchema = z.string()
  .min(1, 'String cannot be empty')
  .max(SECURITY_CONFIG.MAX_STRING_LENGTH, `String exceeds maximum length of ${SECURITY_CONFIG.MAX_STRING_LENGTH}`)
  .transform(sanitizeString)
  .refine(
    (str) => str.length > 0,
    'String cannot be empty after sanitization'
  )

const secureUrlSchema = z.string()
  .min(1, 'URL cannot be empty')
  .max(SECURITY_CONFIG.MAX_STRING_LENGTH, 'URL exceeds maximum length')
  .transform(sanitizeUrl)

// Element ID schema with regex validation before transform
const secureElementIdSchema = z.string()
  .min(1, 'Element ID cannot be empty')
  .max(SECURITY_CONFIG.MAX_STRING_LENGTH, `Element ID exceeds maximum length of ${SECURITY_CONFIG.MAX_STRING_LENGTH}`)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Element ID can only contain letters, numbers, underscores, and hyphens')
  .transform(sanitizeString)

// Text content schema with length limit before transform
const secureTextSchema = z.string()
  .min(1, 'Text cannot be empty')
  .max(500, 'Text content exceeds maximum length')
  .transform(sanitizeString)

// Layer name schema with length limit before transform
const secureLayerNameSchema = z.string()
  .min(1, 'Layer name cannot be empty')
  .max(50, 'Layer name exceeds maximum length')
  .transform(sanitizeString)

const secureObjectIdSchema = z.string()
  .min(1, 'ID cannot be empty')
  .max(50, 'ID exceeds maximum length')
  .transform(sanitizeObjectId)

const secureUsernameSchema = z.string()
  .min(1, 'Username is required')
  .max(SECURITY_CONFIG.MAX_USERNAME_LENGTH, `Username exceeds maximum length of ${SECURITY_CONFIG.MAX_USERNAME_LENGTH}`)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .transform(sanitizeString)

const secureDesignNameSchema = z.string()
  .min(1, 'Design name is required')
  .max(SECURITY_CONFIG.MAX_DESIGN_NAME_LENGTH, `Design name exceeds maximum length of ${SECURITY_CONFIG.MAX_DESIGN_NAME_LENGTH}`)
  .regex(/^[a-zA-Z0-9\s_-]+$/, 'Design name can only contain letters, numbers, spaces, underscores, and hyphens')
  .transform(sanitizeString)

const secureCommentTextSchema = z.string()
  .min(1, 'Comment cannot be empty')
  .max(SECURITY_CONFIG.MAX_COMMENT_LENGTH, `Comment exceeds maximum length of ${SECURITY_CONFIG.MAX_COMMENT_LENGTH}`)
  .transform(sanitizeString)

// Enhanced canvas element schema with strict field validation
const secureCanvasElementSchema = z.object({
  id: secureElementIdSchema,
  type: z.enum(['rect', 'circle', 'text', 'image', 'line', 'drawing'], {
    errorMap: () => ({ message: 'Invalid element type' })
  }),
  x: z.number()
    .finite('X position must be a valid number')
    .min(-SECURITY_CONFIG.MAX_CANVAS_SIZE, 'X position out of bounds')
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, 'X position out of bounds'),
  y: z.number()
    .finite('Y position must be a valid number')
    .min(-SECURITY_CONFIG.MAX_CANVAS_SIZE, 'Y position out of bounds')
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, 'Y position out of bounds'),
  width: z.number()
    .positive('Width must be positive')
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, 'Width exceeds maximum allowed')
    .optional(),
  height: z.number()
    .positive('Height must be positive')
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, 'Height exceeds maximum allowed')
    .optional(),
  radius: z.number()
    .positive('Radius must be positive')
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE / 2, 'Radius exceeds maximum allowed')
    .optional(),
  text: secureTextSchema.optional(),
  fontSize: z.number()
    .positive('Font size must be positive')
    .max(200, 'Font size exceeds maximum allowed')
    .optional(),
  fontFamily: z.enum(['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Arial, sans-serif', 'Helvetica, sans-serif', 'Times New Roman, serif', 'Courier New, monospace', 'Verdana, sans-serif', 'Georgia, serif'], {
    errorMap: () => ({ message: 'Invalid font family' })
  }).optional(),
  fontWeight: z.enum(['normal', 'bold'], {
    errorMap: () => ({ message: 'Invalid font weight' })
  }).optional(),
  fill: z.string()
    .refine(
      (val) => val === 'transparent' || /^#[0-9A-Fa-f]{6}$/.test(val),
      'Fill color must be a valid hex color or "transparent"'
    )
    .optional(),
  stroke: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Stroke color must be a valid hex color')
    .optional(),
  strokeWidth: z.number()
    .min(0, 'Stroke width must be non-negative')
    .max(50, 'Stroke width exceeds maximum allowed')
    .optional(),
  opacity: z.number()
    .min(0, 'Opacity must be between 0 and 1')
    .max(1, 'Opacity must be between 0 and 1')
    .optional(),
  rotation: z.number()
    .finite('Rotation must be a valid number')
    .min(-360, 'Rotation must be between -360 and 360 degrees')
    .max(360, 'Rotation must be between -360 and 360 degrees')
    .optional(),
  scaleX: z.number()
    .positive('ScaleX must be positive')
    .max(10, 'ScaleX exceeds maximum allowed')
    .optional(),
  scaleY: z.number()
    .positive('ScaleY must be positive')
    .max(10, 'ScaleY exceeds maximum allowed')
    .optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  zIndex: z.number()
    .int('Z-index must be an integer')
    .min(0, 'Z-index must be non-negative')
    .max(1000, 'Z-index exceeds maximum allowed')
    .optional(),
  version: z.number()
    .int('Version must be an integer')
    .min(1, 'Version must be at least 1')
    .max(1000, 'Version exceeds maximum allowed')
    .optional(),
  lastModified: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'Last modified must be a valid ISO date string')
    .optional(),
  src: secureUrlSchema.optional(),
  borderRadius: z.number()
    .min(0, 'Border radius must be non-negative')
    .max(100, 'Border radius exceeds maximum allowed')
    .optional(),
  fitMode: z.enum(['cover', 'contain'], {
    errorMap: () => ({ message: 'Invalid fit mode' })
  }).optional(),
  // Drawing-specific properties
  pathData: z.string()
    .max(10000, 'Path data exceeds maximum length')
    .optional(),
        tool: z.enum(['pencil', 'pen'], {
          errorMap: () => ({ message: 'Invalid drawing tool' })
        }).optional(),
  // Strictly limit data field to prevent injection
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .refine(
      (data) => {
        if (!data) return true
        // Limit number of custom data fields
        return Object.keys(data).length <= 10
      },
      'Too many custom data fields'
    )
    .refine(
      (data) => {
        if (!data) return true
        // Validate custom data field names
        return Object.keys(data).every(key => 
          /^[a-zA-Z0-9_-]+$/.test(key) && key.length <= 50
        )
      },
      'Invalid custom data field names'
    )
})

// Enhanced design elements schema with element count limit
const secureDesignElementsSchema = z.object({
  canvas: z.object({
    width: z.number()
      .int('Canvas width must be an integer')
      .min(SECURITY_CONFIG.MIN_CANVAS_SIZE, `Canvas width must be at least ${SECURITY_CONFIG.MIN_CANVAS_SIZE}`)
      .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, `Canvas width must not exceed ${SECURITY_CONFIG.MAX_CANVAS_SIZE}`),
    height: z.number()
      .int('Canvas height must be an integer')
      .min(SECURITY_CONFIG.MIN_CANVAS_SIZE, `Canvas height must be at least ${SECURITY_CONFIG.MIN_CANVAS_SIZE}`)
      .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, `Canvas height must not exceed ${SECURITY_CONFIG.MAX_CANVAS_SIZE}`),
    backgroundColor: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Background color must be a valid hex color')
      .optional()
  }),
  objects: z.array(secureCanvasElementSchema)
    .max(SECURITY_CONFIG.MAX_ELEMENT_COUNT, `Maximum ${SECURITY_CONFIG.MAX_ELEMENT_COUNT} elements allowed`)
})

// Enhanced layer schema
const secureLayerSchema = z.object({
  name: secureLayerNameSchema,
  order: z.number().int().min(0).max(1000, 'Layer order exceeds maximum allowed')
})

// Enhanced comment schema
const secureCommentSchema = z.object({
  author: secureUsernameSchema,
  text: secureTextSchema,
  mentions: z.array(secureUsernameSchema)
    .max(10, 'Maximum 10 mentions allowed')
    .optional()
    .default([])
})

// Enhanced auth schemas
export const secureLoginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email exceeds maximum length')
    .transform(sanitizeString),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password exceeds maximum length')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
})

export const secureRegisterSchema = z.object({
  name: z.string()
    .min(1, 'Name cannot be empty')
    .max(50, 'Name exceeds maximum length')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
    .transform(sanitizeString),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email exceeds maximum length')
    .transform(sanitizeString),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password exceeds maximum length')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
})

// Enhanced design schemas
export const secureCreateDesignSchema = z.object({
  name: secureDesignNameSchema,
  width: z.number()
    .int('Width must be an integer')
    .min(SECURITY_CONFIG.MIN_CANVAS_SIZE, `Width must be at least ${SECURITY_CONFIG.MIN_CANVAS_SIZE}`)
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, `Width must not exceed ${SECURITY_CONFIG.MAX_CANVAS_SIZE}`),
  height: z.number()
    .int('Height must be an integer')
    .min(SECURITY_CONFIG.MIN_CANVAS_SIZE, `Height must be at least ${SECURITY_CONFIG.MIN_CANVAS_SIZE}`)
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, `Height must not exceed ${SECURITY_CONFIG.MAX_CANVAS_SIZE}`),
  elements: secureDesignElementsSchema.optional().default({
    canvas: { width: 1080, height: 1080, backgroundColor: '#ffffff' },
    objects: []
  }),
  layers: z.array(secureLayerSchema)
    .max(50, 'Maximum 50 layers allowed')
    .optional()
    .default([]),
  thumbnail: z.string()
    .max(SECURITY_CONFIG.MAX_STRING_LENGTH, 'Thumbnail data exceeds maximum length')
    .optional()
})

export const secureUpdateDesignSchema = z.object({
  name: secureDesignNameSchema.optional(),
  width: z.number()
    .int('Width must be an integer')
    .min(SECURITY_CONFIG.MIN_CANVAS_SIZE, `Width must be at least ${SECURITY_CONFIG.MIN_CANVAS_SIZE}`)
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, `Width must not exceed ${SECURITY_CONFIG.MAX_CANVAS_SIZE}`)
    .optional(),
  height: z.number()
    .int('Height must be an integer')
    .min(SECURITY_CONFIG.MIN_CANVAS_SIZE, `Height must be at least ${SECURITY_CONFIG.MIN_CANVAS_SIZE}`)
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, `Height must not exceed ${SECURITY_CONFIG.MAX_CANVAS_SIZE}`)
    .optional(),
  elements: secureDesignElementsSchema.optional(),
  layers: z.array(secureLayerSchema)
    .max(50, 'Maximum 50 layers allowed')
    .optional(),
  thumbnail: z.string()
    .max(SECURITY_CONFIG.MAX_STRING_LENGTH, 'Thumbnail data exceeds maximum length')
    .optional()
})

export const secureSaveDesignSchema = z.object({
  elements: secureDesignElementsSchema,
  layers: z.array(secureLayerSchema)
    .max(50, 'Maximum 50 layers allowed')
    .optional(),
  thumbnail: z.string()
    .max(SECURITY_CONFIG.MAX_STRING_LENGTH, 'Thumbnail data exceeds maximum length')
    .optional()
})

export const secureAddCommentSchema = z.object({
  text: secureCommentTextSchema,
  mentions: z.array(secureUsernameSchema)
    .max(10, 'Maximum 10 mentions allowed')
    .optional()
    .default([]),
  elementId: secureElementIdSchema.optional()
})

// Enhanced query parameter validation
export const secureDesignQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .transform(Number)
    .refine(n => n >= 1 && n <= 1000, 'Page must be between 1 and 1000')
    .optional()
    .default(1),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .transform(Number)
    .refine(n => n >= 1 && n <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default(10),
  search: z.string()
    .max(100, 'Search term exceeds maximum length')
    .transform(sanitizeString)
    .optional(),
  createdBy: secureObjectIdSchema.optional(),
  sortBy: z.enum(['name', 'updatedAt', 'createdAt'], {
    errorMap: () => ({ message: 'Invalid sort field' })
  }).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Invalid sort order' })
  }).optional().default('desc')
})

// Enhanced params validation
export const secureDesignParamsSchema = z.object({
  id: secureObjectIdSchema
})

export const secureThumbnailSchema = z.object({
  thumbnail: z.string()
    .min(1, 'Thumbnail data is required')
    .max(SECURITY_CONFIG.MAX_STRING_LENGTH, 'Thumbnail data exceeds maximum length')
    .refine(
      (data: string) => data.startsWith('data:image/png;base64,') || data.startsWith('data:image/jpeg;base64,'),
      'Thumbnail must be a base64 encoded PNG or JPEG image'
    )
    .refine(
      (data: string) => {
        const base64Data = data.split(',')[1]
        if (!base64Data) return false
        const sizeInBytes = (base64Data.length * 3) / 4
        return sizeInBytes <= SECURITY_CONFIG.MAX_THUMBNAIL_SIZE
      },
      `Thumbnail size must not exceed ${SECURITY_CONFIG.MAX_THUMBNAIL_SIZE / 1024 / 1024}MB`
    )
})

// Socket event validation schemas
export const secureSocketJoinSchema = z.object({
  designId: secureObjectIdSchema,
  userName: secureUsernameSchema.optional()
})

export const secureSocketElementOperationSchema = z.object({
  type: z.enum(['element_added', 'element_updated', 'element_deleted', 'element_moved', 'element_transformed'], {
    errorMap: () => ({ message: 'Invalid operation type' })
  }),
  designId: secureObjectIdSchema,
  elementId: secureElementIdSchema,
  element: secureCanvasElementSchema.optional(),
  updates: z.record(z.any()).optional(),
  version: z.number().int().positive().optional()
})

export const secureSocketCursorMoveSchema = z.object({
  x: z.number()
    .finite('X coordinate must be a valid number')
    .min(-SECURITY_CONFIG.MAX_CANVAS_SIZE, 'X coordinate out of bounds')
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, 'X coordinate out of bounds'),
  y: z.number()
    .finite('Y coordinate must be a valid number')
    .min(-SECURITY_CONFIG.MAX_CANVAS_SIZE, 'Y coordinate out of bounds')
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, 'Y coordinate out of bounds')
})

export const secureSocketElementDragSchema = z.object({
  elementId: secureElementIdSchema,
  x: z.number()
    .finite('X coordinate must be a valid number')
    .min(-SECURITY_CONFIG.MAX_CANVAS_SIZE, 'X coordinate out of bounds')
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, 'X coordinate out of bounds'),
  y: z.number()
    .finite('Y coordinate must be a valid number')
    .min(-SECURITY_CONFIG.MAX_CANVAS_SIZE, 'Y coordinate out of bounds')
    .max(SECURITY_CONFIG.MAX_CANVAS_SIZE, 'Y coordinate out of bounds')
})

// Type exports
export type SecureLoginInput = z.infer<typeof secureLoginSchema>
export type SecureRegisterInput = z.infer<typeof secureRegisterSchema>
export type SecureCreateDesignInput = z.infer<typeof secureCreateDesignSchema>
export type SecureUpdateDesignInput = z.infer<typeof secureUpdateDesignSchema>
export type SecureSaveDesignInput = z.infer<typeof secureSaveDesignSchema>
export type SecureAddCommentInput = z.infer<typeof secureAddCommentSchema>
export type SecureDesignQueryParams = z.infer<typeof secureDesignQuerySchema>
export type SecureDesignParams = z.infer<typeof secureDesignParamsSchema>
export type SecureThumbnailInput = z.infer<typeof secureThumbnailSchema>
export type SecureCanvasElement = z.infer<typeof secureCanvasElementSchema>
export type SecureDesignElements = z.infer<typeof secureDesignElementsSchema>
export type SecureSocketJoinInput = z.infer<typeof secureSocketJoinSchema>
export type SecureSocketElementOperation = z.infer<typeof secureSocketElementOperationSchema>
export type SecureSocketCursorMove = z.infer<typeof secureSocketCursorMoveSchema>
export type SecureSocketElementDrag = z.infer<typeof secureSocketElementDragSchema>

// Enhanced validation middleware with security logging
export const secureValidate = (schema: z.ZodSchema, logSecurityEvents = true) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.parse(req.body)
      req.body = result // Use sanitized data
      next()
    } catch (error: any) {
      if (logSecurityEvents) {
        console.warn(`[SECURITY] Validation failed for ${req.path}:`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          body: req.body,
          error: error.errors
        })
      }
      
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

export const secureValidateQuery = (schema: z.ZodSchema, logSecurityEvents = true) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.parse(req.query)
      req.query = result // Use sanitized data
      next()
    } catch (error: any) {
      if (logSecurityEvents) {
        console.warn(`[SECURITY] Query validation failed for ${req.path}:`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          query: req.query,
          error: error.errors
        })
      }
      
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

export const secureValidateParams = (schema: z.ZodSchema, logSecurityEvents = true) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.parse(req.params)
      req.params = result // Use sanitized data
      next()
    } catch (error: any) {
      if (logSecurityEvents) {
        console.warn(`[SECURITY] Params validation failed for ${req.path}:`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          params: req.params,
          error: error.errors
        })
      }
      
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

// Socket validation middleware
export const validateSocketEvent = (schema: z.ZodSchema) => {
  return (data: any) => {
    try {
      return schema.parse(data)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.warn(`[SECURITY] Socket event validation failed:`, {
          data,
          error: error.errors
        })
        throw new Error(`Invalid socket event data: ${error.errors.map(e => e.message).join(', ')}`)
      }
      throw error
    }
  }
}
