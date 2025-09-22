import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  isOperational?: boolean
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500
  let code = error.code || 'INTERNAL_ERROR'
  let message = error.message || 'Internal Server Error'
  let details = 'An unexpected error occurred'

  // Mongoose validation error
  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    code = 'VALIDATION_ERROR'
    message = 'Validation failed'
    details = Object.values(error.errors).map(err => err.message).join(', ')
  }

  // Mongoose cast error (invalid ObjectId)
  if (error instanceof mongoose.Error.CastError) {
    statusCode = 400
    code = 'INVALID_ID'
    message = 'Invalid ID format'
    details = `Invalid ${error.path}: ${error.value}`
  }

  // Mongoose duplicate key error
  if (error instanceof mongoose.Error && (error as any).code === 11000) {
    statusCode = 409
    code = 'DUPLICATE_KEY'
    message = 'Duplicate entry'
    details = 'A record with this information already exists'
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    code = 'INVALID_TOKEN'
    message = 'Invalid token'
    details = 'The provided token is invalid'
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401
    code = 'TOKEN_EXPIRED'
    message = 'Token expired'
    details = 'The provided token has expired'
  }

  // Log error details
  console.error(`[${new Date().toISOString()}] Error ${statusCode} (${code}): ${message}`)
  console.error('Stack:', error.stack)
  console.error('Request:', {
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query
  })

  // Send structured error response
  res.status(statusCode).json({
    success: false,
    code,
    message,
    details,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    })
  })
}

export const createError = (
  message: string, 
  statusCode: number = 500, 
  code: string = 'INTERNAL_ERROR'
): ApiError => {
  const error: ApiError = new Error(message)
  error.statusCode = statusCode
  error.code = code
  error.isOperational = true
  return error
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    code: 'ROUTE_NOT_FOUND',
    message: 'Route not found',
    details: `The requested route ${req.method} ${req.path} does not exist`,
    timestamp: new Date().toISOString()
  })
}
