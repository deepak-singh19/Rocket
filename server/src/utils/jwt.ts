import jwt from 'jsonwebtoken'
import { IUser } from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'

export interface JWTPayload {
  userId: string
  email: string
  name: string
  iat?: number
  exp?: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

// Generate access token
export const generateAccessToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id,
    email: user.email,
    name: user.name
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'canvas-studio',
    audience: 'canvas-studio-users'
  })
}

// Generate refresh token
export const generateRefreshToken = (user: IUser): string => {
  const payload = {
    userId: user._id,
    type: 'refresh'
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'canvas-studio',
    audience: 'canvas-studio-users'
  })
}

// Generate both tokens
export const generateTokenPair = (user: IUser): TokenPair => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  }
}

// Verify access token
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'canvas-studio',
      audience: 'canvas-studio-users'
    }) as JWTPayload

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_TOKEN')
    } else {
      throw new Error('TOKEN_VERIFICATION_FAILED')
    }
  }
}

// Verify refresh token
export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'canvas-studio',
      audience: 'canvas-studio-users'
    }) as any

    if (decoded.type !== 'refresh') {
      throw new Error('INVALID_TOKEN_TYPE')
    }

    return { userId: decoded.userId }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('REFRESH_TOKEN_EXPIRED')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_REFRESH_TOKEN')
    } else {
      throw new Error('REFRESH_TOKEN_VERIFICATION_FAILED')
    }
  }
}

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}

// Get token expiration time
export const getTokenExpirationTime = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000)
    }
    return null
  } catch (error) {
    return null
  }
}

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any
    if (decoded && decoded.exp) {
      return Date.now() >= decoded.exp * 1000
    }
    return true
  } catch (error) {
    return true
  }
}
