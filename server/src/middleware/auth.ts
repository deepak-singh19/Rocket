import { Request, Response, NextFunction } from 'express'
import { User, IUser } from '../models/User.js'
import { verifyAccessToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt.js'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: IUser
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization)
    
    if (!token) {
      res.status(401).json({
        code: 'MISSING_TOKEN',
        message: 'Access token is required',
        details: 'Please provide a valid Bearer token in the Authorization header'
      })
      return
    }

    // Verify token
    const payload: JWTPayload = verifyAccessToken(token)

    // Find user by ID
    const user = await User.findById(payload.userId)
    if (!user) {
      res.status(401).json({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        details: 'The user associated with this token no longer exists'
      })
      return
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        code: 'ACCOUNT_DISABLED',
        message: 'Account is disabled',
        details: 'Your account has been disabled. Please contact support.'
      })
      return
    }

    // Attach user to request
    req.user = user
    next()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage === 'TOKEN_EXPIRED') {
      res.status(401).json({
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired',
        details: 'Please refresh your token or login again'
      })
      return
    }

    if (errorMessage === 'INVALID_TOKEN') {
      res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid access token',
        details: 'The provided token is invalid or malformed'
      })
      return
    }

    res.status(401).json({
      code: 'AUTHENTICATION_FAILED',
      message: 'Authentication failed',
      details: errorMessage
    })
  }
}

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization)
    
    if (!token) {
      // No token provided, continue without user
      next()
      return
    }

    // Try to verify token
    const payload: JWTPayload = verifyAccessToken(token)
    const user = await User.findById(payload.userId)
    
    if (user && user.isActive) {
      req.user = user
    }
    
    next()
  } catch (error) {
    // Token verification failed, continue without user
    next()
  }
}

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: 'Please provide a valid access token'
      })
      return
    }

    // For now, we'll implement a simple role system
    // In a real application, you might have a roles field in the User model
    const userRole = 'user' // Default role for all users
    
    if (!roles.includes(userRole)) {
      res.status(403).json({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions',
        details: `This action requires one of the following roles: ${roles.join(', ')}`
      })
      return
    }

    next()
  }
}

// Check if user owns the resource
export const checkOwnership = (resourceUserIdField: string = 'createdBy') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: 'Please provide a valid access token'
      })
      return
    }

    // This middleware should be used after the resource is loaded
    // and attached to req (e.g., req.design, req.project, etc.)
    const resource = req.params.resource || req.body
    
    if (!resource || !resource[resourceUserIdField]) {
      res.status(400).json({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Resource not found',
        details: 'The requested resource could not be found'
      })
      return
    }

    if (resource[resourceUserIdField].toString() !== req.user._id.toString()) {
      res.status(403).json({
        code: 'ACCESS_DENIED',
        message: 'Access denied',
        details: 'You do not have permission to access this resource'
      })
      return
    }

    next()
  }
}

// Rate limiting for auth endpoints
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>()
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown'
    const now = Date.now()
    const userAttempts = attempts.get(key)
    
    if (!userAttempts || now > userAttempts.resetTime) {
      // Reset or create new attempt record
      attempts.set(key, { count: 1, resetTime: now + windowMs })
      next()
      return
    }
    
    if (userAttempts.count >= maxAttempts) {
      res.status(429).json({
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Too many authentication attempts',
        details: `Please wait ${Math.ceil((userAttempts.resetTime - now) / 1000)} seconds before trying again`
      })
      return
    }
    
    userAttempts.count++
    next()
  }
}
