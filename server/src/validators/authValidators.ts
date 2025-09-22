import { z } from 'zod'

// Login validation schema
export const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
    .max(100, 'Email cannot exceed 100 characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password cannot exceed 100 characters')
})

// Registration validation schema
export const registerSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
    .max(100, 'Email cannot exceed 100 characters')
    .transform(email => email.toLowerCase().trim()),
  password: z.string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .trim()
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
})

// Refresh token validation schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required')
})

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
})

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    )
})

// Profile update schema
export const updateProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .trim()
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
    .optional(),
  avatar: z.string()
    .url('Avatar must be a valid URL')
    .optional()
})

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters long')
    .max(100, 'New password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'New password must contain at least one lowercase letter, one uppercase letter, and one number'
    )
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.body)
      req.body = validatedData
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        })
        return
      }
      next(error)
    }
  }
}

// Query validation middleware
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.query)
      req.query = validatedData
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          code: 'QUERY_VALIDATION_ERROR',
          message: 'Query validation failed',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        })
        return
      }
      next(error)
    }
  }
}

// Params validation middleware
export const validateParams = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.params)
      req.params = validatedData
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          code: 'PARAMS_VALIDATION_ERROR',
          message: 'Parameters validation failed',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        })
        return
      }
      next(error)
    }
  }
}
