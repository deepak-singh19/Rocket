import { z } from 'zod'

// Position validation for canvas comments
const positionSchema = z.object({
  x: z.number().min(0).max(10000),
  y: z.number().min(0).max(10000)
}).optional()

// Mention validation
const mentionSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  userEmail: z.string().email()
})

// Create comment validation
export const createCommentSchema = z.object({
  body: z.object({
    designId: z.string().min(1, 'Design ID is required'),
    content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
    mentions: z.array(mentionSchema).optional().default([]),
    position: positionSchema,
    elementId: z.string().optional(),
    parentId: z.string().optional()
  })
})

// Update comment validation
export const updateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
    mentions: z.array(mentionSchema).optional().default([])
  })
})

// Query comments validation
export const getCommentsSchema = z.object({
  params: z.object({
    designId: z.string().min(1, 'Design ID is required')
  }),
  query: z.object({
    resolved: z.enum(['true', 'false']).optional(),
    elementId: z.string().optional(),
    parentId: z.string().optional(),
    page: z.union([
      z.string().regex(/^\d+$/).transform(Number),
      z.number()
    ]).optional().default(1),
    limit: z.union([
      z.string().regex(/^\d+$/).transform(Number),
      z.number()
    ]).optional().default(50)
  })
})

// Resolve comment validation
export const resolveCommentSchema = z.object({
  body: z.object({
    isResolved: z.boolean()
  })
})

// Comment ID param validation
export const commentIdSchema = z.object({
  params: z.object({
    commentId: z.string().min(1, 'Comment ID is required')
  })
})

// Design ID param validation
export const designIdSchema = z.object({
  params: z.object({
    designId: z.string().min(1, 'Design ID is required')
  })
})
