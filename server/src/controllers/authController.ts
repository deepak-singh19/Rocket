import { Request, Response } from 'express'
import { User, IUser } from '../models/User.js'
import { generateTokenPair, verifyRefreshToken, JWTPayload } from '../utils/jwt.js'
import mongoose from 'mongoose'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser
    }
  }
}

export class AuthController {
  // POST /api/auth/login - User login
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required',
          details: 'Please provide both email and password'
        })
        return
      }

      // Find user by email (include password field)
      const user = await User.findByEmail(email)
      if (!user) {
        res.status(401).json({
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          details: 'The provided credentials are incorrect'
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

      // Compare password
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        res.status(401).json({
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          details: 'The provided credentials are incorrect'
        })
        return
      }

      // Update last login
      await user.updateLastLogin()

      // Generate tokens
      const tokens = generateTokenPair(user)

      // Return success response
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            lastLogin: user.lastLogin
          },
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: '7d'
          }
        }
      })
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // POST /api/auth/register - User registration
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name } = req.body

      // Validate required fields
      if (!email || !password || !name) {
        res.status(400).json({
          code: 'MISSING_FIELDS',
          message: 'Email, password, and name are required',
          details: 'Please provide email, password, and name'
        })
        return
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        res.status(409).json({
          code: 'USER_EXISTS',
          message: 'User already exists',
          details: 'An account with this email already exists'
        })
        return
      }

      // Create new user
      const user = new User({
        email: email.toLowerCase(),
        password,
        name: name.trim()
      })

      await user.save()

      // Generate tokens
      const tokens = generateTokenPair(user)

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            createdAt: user.createdAt
          },
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: '7d'
          }
        }
      })
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        const errors = Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message
        }))
        
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors
        })
        return
      }

      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Registration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // POST /api/auth/refresh - Refresh access token
  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        res.status(400).json({
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required',
          details: 'Please provide a refresh token'
        })
        return
      }

      // Verify refresh token
      const { userId } = verifyRefreshToken(refreshToken)

      // Find user
      const user = await User.findById(userId)
      if (!user || !user.isActive) {
        res.status(401).json({
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token',
          details: 'The refresh token is invalid or user account is disabled'
        })
        return
      }

      // Generate new tokens
      const tokens = generateTokenPair(user)

      // Return success response
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: '7d'
          }
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('EXPIRED')) {
        res.status(401).json({
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token expired',
          details: 'Please login again'
        })
        return
      }

      res.status(401).json({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token',
        details: errorMessage
      })
    }
  }

  // GET /api/auth/me - Get current user profile
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: 'Please provide a valid access token'
        })
        return
      }

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            _id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            avatar: req.user.avatar,
            lastLogin: req.user.lastLogin,
            createdAt: req.user.createdAt
          }
        }
      })
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // POST /api/auth/logout - User logout (client-side token invalidation)
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a stateless JWT system, logout is handled client-side
      // by removing tokens from storage. This endpoint is for consistency.
      res.json({
        success: true,
        message: 'Logout successful',
        data: {
          message: 'Please remove tokens from client storage'
        }
      })
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Logout failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}