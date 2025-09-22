import { Request, Response, NextFunction } from 'express'

// Extend Request interface for file uploads
interface MulterRequest extends Request {
  file?: {
    mimetype: string
    size: number
  }
}
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import validator from 'validator'
import { body, validationResult } from 'express-validator'

// Security configuration
const SECURITY_CONFIG = {
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 10000, // 10000 requests per window (very generous for development)
  SLOW_DOWN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  SLOW_DOWN_DELAY_AFTER: 5000, // After 5000 requests (very generous)
  SLOW_DOWN_DELAY_MS: 100, // Delay by 100ms (minimal)
  MAX_LOGIN_ATTEMPTS: 10, // Max login attempts per window
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_JSON_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_URL_LENGTH: 2048,
  MAX_HEADER_SIZE: 8192,
}

// Enhanced Helmet configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://picsum.photos"],
      connectSrc: ["'self'", "http://localhost:4000", "ws://localhost:4000"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})

// Rate limiting middleware
export const generalRateLimit = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS,
  max: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later',
    retryAfter: Math.ceil(SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`[SECURITY] Rate limit exceeded for IP ${req.ip}`)
    res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
      retryAfter: Math.ceil(SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS / 1000)
    })
  }
})

// Strict rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: SECURITY_CONFIG.LOGIN_WINDOW_MS,
  max: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
  message: {
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later',
    retryAfter: Math.ceil(SECURITY_CONFIG.LOGIN_WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`[SECURITY] Auth rate limit exceeded for IP ${req.ip}`)
    res.status(429).json({
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
      retryAfter: Math.ceil(SECURITY_CONFIG.LOGIN_WINDOW_MS / 1000)
    })
  }
})

// Slow down middleware for API endpoints
export const apiSlowDown = slowDown({
  windowMs: SECURITY_CONFIG.SLOW_DOWN_WINDOW_MS,
  delayAfter: SECURITY_CONFIG.SLOW_DOWN_DELAY_AFTER,
  delayMs: () => SECURITY_CONFIG.SLOW_DOWN_DELAY_MS,
  validate: { delayMs: false }
})

// MongoDB injection protection
export const mongoSanitization = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] MongoDB injection attempt blocked:`, {
      ip: req.ip,
      key,
      userAgent: req.get('User-Agent')
    })
  }
})

// Request size limiting
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = parseInt(req.get('content-length') || '0')
  
  if (contentLength > SECURITY_CONFIG.MAX_JSON_SIZE) {
    console.warn(`[SECURITY] Request size limit exceeded:`, {
      ip: req.ip,
      contentLength,
      maxSize: SECURITY_CONFIG.MAX_JSON_SIZE,
      userAgent: req.get('User-Agent')
    })
    
    res.status(413).json({
      code: 'REQUEST_TOO_LARGE',
      message: 'Request payload too large',
      maxSize: SECURITY_CONFIG.MAX_JSON_SIZE
    })
    return
  }
  
  next()
}

// URL length validation
export const urlLengthValidation = (req: Request, res: Response, next: NextFunction): void => {
  const url = req.originalUrl
  
  if (url.length > SECURITY_CONFIG.MAX_URL_LENGTH) {
    console.warn(`[SECURITY] URL length limit exceeded:`, {
      ip: req.ip,
      urlLength: url.length,
      maxLength: SECURITY_CONFIG.MAX_URL_LENGTH,
      userAgent: req.get('User-Agent')
    })
    
    res.status(414).json({
      code: 'URL_TOO_LONG',
      message: 'Request URL too long',
      maxLength: SECURITY_CONFIG.MAX_URL_LENGTH
    })
    return
  }
  
  next()
}

// Header size validation
export const headerSizeValidation = (req: Request, res: Response, next: NextFunction): void => {
  const headerSize = JSON.stringify(req.headers).length
  
  if (headerSize > SECURITY_CONFIG.MAX_HEADER_SIZE) {
    console.warn(`[SECURITY] Header size limit exceeded:`, {
      ip: req.ip,
      headerSize,
      maxSize: SECURITY_CONFIG.MAX_HEADER_SIZE,
      userAgent: req.get('User-Agent')
    })
    
    res.status(431).json({
      code: 'HEADERS_TOO_LARGE',
      message: 'Request headers too large',
      maxSize: SECURITY_CONFIG.MAX_HEADER_SIZE
    })
    return
  }
  
  next()
}

// Input sanitization middleware
export const inputSanitization = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = validator.escape(value)
      }
    }
  }
  
  // Sanitize body parameters (for non-JSON content)
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body)
  }
  
  next()
}

// Recursive object sanitization
const sanitizeObject = (obj: any): void => {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      obj[key] = validator.escape(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitizeObject(value)
    }
  }
}

// Security logging middleware
export const securityLogging = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<script/i,
    /eval\(/i,
    /expression\(/i,
    /\$where/i,
    /\$ne/i,
    /\$gt/i,
    /\$lt/i,
    /\$regex/i
  ]
  
  const checkSuspicious = (data: any, path: string = ''): boolean => {
    if (typeof data === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(data))
    } else if (typeof data === 'object' && data !== null) {
      return Object.entries(data).some(([key, value]) => 
        checkSuspicious(value, `${path}.${key}`)
      )
    }
    return false
  }
  
  // Check request data for suspicious patterns
  if (checkSuspicious(req.body, 'body') || 
      checkSuspicious(req.query, 'query') || 
      checkSuspicious(req.params, 'params')) {
    
    console.warn(`[SECURITY] Suspicious request detected:`, {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      params: req.params,
      timestamp: new Date().toISOString()
    })
  }
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime
    
    if (res.statusCode >= 400) {
      console.warn(`[SECURITY] Error response:`, {
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      })
    }
  })
  
  next()
}

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown'
    
    if (!allowedIPs.includes(clientIP)) {
      console.warn(`[SECURITY] IP whitelist violation:`, {
        ip: clientIP,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      })
      
      res.status(403).json({
        code: 'IP_NOT_ALLOWED',
        message: 'Access denied from this IP address'
      })
      return
    }
    
    next()
  }
}

// Request validation middleware
export const validateRequest = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)))
    
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.warn(`[SECURITY] Request validation failed:`, {
        ip: req.ip,
        url: req.originalUrl,
        errors: errors.array(),
        userAgent: req.get('User-Agent')
      })
      
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: errors.array()
      })
      return
    }
    
    next()
  }
}

// File upload validation
export const validateFileUpload = (allowedTypes: string[], maxSize: number) => {
  return (req: MulterRequest, res: Response, next: NextFunction): void => {
    if (!req.file) {
      return next()
    }
    
    const { mimetype, size } = req.file
    
    if (!allowedTypes.includes(mimetype)) {
      console.warn(`[SECURITY] Invalid file type upload attempt:`, {
        ip: req.ip,
        mimetype,
        userAgent: req.get('User-Agent')
      })
      
      res.status(400).json({
        code: 'INVALID_FILE_TYPE',
        message: 'File type not allowed',
        allowedTypes
      })
      return
    }
    
    if (size > maxSize) {
      console.warn(`[SECURITY] File size limit exceeded:`, {
        ip: req.ip,
        size,
        maxSize,
        userAgent: req.get('User-Agent')
      })
      
      res.status(400).json({
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds maximum allowed',
        maxSize
      })
      return
    }
    
    next()
  }
}

// Security event monitoring
export const securityMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  // Monitor for potential attacks
  const attackPatterns = [
    { pattern: /\.\./, name: 'Path Traversal' },
    { pattern: /<script/i, name: 'XSS Attempt' },
    { pattern: /union.*select/i, name: 'SQL Injection' },
    { pattern: /\$where/i, name: 'NoSQL Injection' },
    { pattern: /eval\(/i, name: 'Code Injection' },
    { pattern: /javascript:/i, name: 'JavaScript Injection' }
  ]
  
  const checkForAttacks = (data: any, path: string = ''): string[] => {
    const attacks: string[] = []
    
    if (typeof data === 'string') {
      attackPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(data)) {
          attacks.push(`${name} in ${path}`)
        }
      })
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        attacks.push(...checkForAttacks(value, `${path}.${key}`))
      })
    }
    
    return attacks
  }
  
  const attacks = [
    ...checkForAttacks(req.body, 'body'),
    ...checkForAttacks(req.query, 'query'),
    ...checkForAttacks(req.params, 'params')
  ]
  
  if (attacks.length > 0) {
    console.error(`[SECURITY] Potential attack detected:`, {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      attacks,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    })
    
    // Optionally block the request
    res.status(403).json({
      code: 'SECURITY_VIOLATION',
      message: 'Request blocked due to security policy violation'
    })
    return
  }
  
  next()
}


// short-circuit OPTIONS preflight before any heavy security checks
const preflightPassthrough = (req: Request, _res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    // quick-return for preflight so other middleware (rate-limit, validators, etc.) can't throw
    return next()
  }
  next()
}

// Export security middleware stack
export const securityMiddleware = [
  preflightPassthrough,
  securityHeaders,
  mongoSanitization,
  requestSizeLimit,
  urlLengthValidation,
  headerSizeValidation,
  inputSanitization,
  securityLogging,
  securityMonitoring,
  generalRateLimit
]
