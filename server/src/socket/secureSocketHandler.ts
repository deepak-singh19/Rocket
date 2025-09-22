import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { 
  validateSocketEvent,
  secureSocketJoinSchema,
  secureSocketElementOperationSchema,
  secureSocketCursorMoveSchema,
  secureSocketElementDragSchema
} from '../validators/securityValidators.js'

export interface SecureUser {
  id: string
  name: string
  color: string
  cursor?: { x: number; y: number }
  lastActivity: Date
  connectionCount: number
}

export interface SecureRoomUser extends SecureUser {
  socketId: string
  joinedAt: Date
  ipAddress: string
  userAgent: string
}

export interface SecureCollaborationEvent {
  type: 'element_added' | 'element_updated' | 'element_deleted' | 'element_moved' | 'element_transformed' | 'cursor_moved' | 'user_joined' | 'user_left'
  designId: string
  userId: string
  timestamp: number
  data: any
  version?: number
}

export interface SecureElementOperation extends SecureCollaborationEvent {
  elementId: string
  element?: any
  updates?: any
}

// Security configuration
const SECURITY_CONFIG = {
  MAX_ROOM_SIZE: 50,
  MAX_EVENTS_PER_MINUTE: 100,
  MAX_CURSOR_UPDATES_PER_MINUTE: 60,
  MAX_ELEMENT_OPERATIONS_PER_MINUTE: 30,
  CONNECTION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  MAX_USERNAME_LENGTH: 50,
  MAX_DESIGN_ID_LENGTH: 24,
  ALLOWED_EVENT_TYPES: [
    'element_added', 'element_updated', 'element_deleted', 
    'element_moved', 'element_transformed', 'cursor_moved', 
    'user_joined', 'user_left'
  ]
}

// Room management with security
const rooms = new Map<string, Map<string, SecureRoomUser>>()
const userRooms = new Map<string, string>() // socketId -> designId
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const connectionCounts = new Map<string, number>() // IP -> count

// Security utilities
const generateSecureUserColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

const generateSecureUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const sanitizeUsername = (username: string): string => {
  return username
    .trim()
    .substring(0, SECURITY_CONFIG.MAX_USERNAME_LENGTH)
    .replace(/[^a-zA-Z0-9_-]/g, '')
}

const sanitizeDesignId = (designId: string): string => {
  const cleaned = designId.trim().substring(0, SECURITY_CONFIG.MAX_DESIGN_ID_LENGTH)
  if (!/^[0-9a-fA-F]{24}$/.test(cleaned)) {
    throw new Error('Invalid design ID format')
  }
  return cleaned
}

// Rate limiting for socket events
const checkRateLimit = (socketId: string, eventType: string): boolean => {
  const key = `${socketId}:${eventType}`
  const now = Date.now()
  const limit = rateLimitMap.get(key)
  
  let maxEvents: number
  switch (eventType) {
    case 'cursor_move':
      maxEvents = SECURITY_CONFIG.MAX_CURSOR_UPDATES_PER_MINUTE
      break
    case 'element_operation':
      maxEvents = SECURITY_CONFIG.MAX_ELEMENT_OPERATIONS_PER_MINUTE
      break
    default:
      maxEvents = SECURITY_CONFIG.MAX_EVENTS_PER_MINUTE
  }
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW })
    return true
  }
  
  if (limit.count >= maxEvents) {
    return false
  }
  
  limit.count++
  return true
}

// Connection limit checking
const checkConnectionLimit = (ipAddress: string): boolean => {
  const count = connectionCounts.get(ipAddress) || 0
  const maxConnections = 10 // Max 10 connections per IP
  
  if (count >= maxConnections) {
    console.warn(`[SECURITY] Connection limit exceeded for IP ${ipAddress}`)
    return false
  }
  
  connectionCounts.set(ipAddress, count + 1)
  return true
}

// Security logging
const logSecurityEvent = (event: string, details: any) => {
  console.warn(`[SECURITY] Socket ${event}:`, {
    ...details,
    timestamp: new Date().toISOString()
  })
}

// Cleanup expired rate limits
setInterval(() => {
  const now = Date.now()
  for (const [key, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, SECURITY_CONFIG.RATE_LIMIT_WINDOW)

export const setupSecureSocketHandler = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true
    },
    maxHttpBufferSize: 1024 * 1024, // 1MB max
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true // Allow Engine.IO v3 clients
  })

  io.on('connection', (socket) => {
    const ipAddress = socket.handshake.address
    const userAgent = socket.handshake.headers['user-agent'] || 'Unknown'

    // Check connection limit
    if (!checkConnectionLimit(ipAddress)) {
      logSecurityEvent('CONNECTION_LIMIT_EXCEEDED', {
        socketId: socket.id,
        ipAddress,
        userAgent
      })
      socket.disconnect(true)
      return
    }
    
    // Set connection timeout
    const timeout = setTimeout(() => {
      logSecurityEvent('CONNECTION_TIMEOUT', {
        socketId: socket.id,
        ipAddress,
        userAgent
      })
      socket.disconnect(true)
    }, SECURITY_CONFIG.CONNECTION_TIMEOUT)
    
    // Clear timeout on disconnect
    socket.on('disconnect', () => {
      clearTimeout(timeout)
      const count = connectionCounts.get(ipAddress) || 0
      if (count > 0) {
        connectionCounts.set(ipAddress, count - 1)
      }
    })

    // Join design room with validation
    socket.on('join_design', (data: any) => {
      try {
        // Validate input data
        const validatedData = validateSocketEvent(secureSocketJoinSchema)(data)
        const { designId, userName } = validatedData
        
        const roomName = `design:${designId}`
        
        // Check room size limit
        const room = rooms.get(roomName)
        if (room && room.size >= SECURITY_CONFIG.MAX_ROOM_SIZE) {
          logSecurityEvent('ROOM_SIZE_LIMIT_EXCEEDED', {
            socketId: socket.id,
            designId,
            roomSize: room.size,
            ipAddress,
            userAgent
          })
          socket.emit('error', {
            code: 'ROOM_FULL',
            message: 'Design room is full'
          })
          return
        }
        
        // Leave previous room if any
        const previousRoom = userRooms.get(socket.id)
        if (previousRoom) {
          socket.leave(previousRoom)
          removeUserFromRoom(socket.id, previousRoom)
        }
        
        // Join new room
        socket.join(roomName)
        userRooms.set(socket.id, roomName)
        
        // Create secure user
        const user: SecureRoomUser = {
          id: generateSecureUserId(),
          name: sanitizeUsername(userName || `User ${socket.id.slice(-4)}`),
          color: generateSecureUserColor(),
          socketId: socket.id,
          joinedAt: new Date(),
          ipAddress,
          userAgent,
          lastActivity: new Date(),
          connectionCount: 1
        }
        
        // Add user to room
        if (!rooms.has(roomName)) {
          rooms.set(roomName, new Map())
        }
        rooms.get(roomName)!.set(socket.id, user)
        
        // Notify user of successful join
        socket.emit('joined_design', {
          userId: user.id,
          userName: user.name,
          userColor: user.color,
          roomUsers: Array.from(rooms.get(roomName)!.values()).map(u => ({
            id: u.id,
            name: u.name,
            color: u.color,
            cursor: u.cursor
          }))
        })
        
        // Notify other users in room
        socket.to(roomName).emit('user_joined', {
          userId: user.id,
          userName: user.name,
          userColor: user.color
        })

      } catch (error: any) {
        logSecurityEvent('JOIN_VALIDATION_FAILED', {
          socketId: socket.id,
          data,
          error: error.message,
          ipAddress,
          userAgent
        })
        socket.emit('error', {
          code: 'VALIDATION_ERROR',
          message: error.message
        })
      }
    })

    // Handle element operations with validation
    socket.on('element_operation', (operation: any) => {
      try {
        // Check rate limit
        if (!checkRateLimit(socket.id, 'element_operation')) {
          logSecurityEvent('RATE_LIMIT_EXCEEDED', {
            socketId: socket.id,
            eventType: 'element_operation',
            ipAddress,
            userAgent
          })
          socket.emit('error', {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many element operations'
          })
          return
        }
        
        // Validate operation data

        const validatedOperation = validateSocketEvent(secureSocketElementOperationSchema)(operation)

        const roomName = userRooms.get(socket.id)
        if (!roomName) {
          socket.emit('error', {
            code: 'NOT_IN_ROOM',
            message: 'Must join a design room first'
          })
          return
        }
        
        const user = rooms.get(roomName)?.get(socket.id)
        if (!user) {
          socket.emit('error', {
            code: 'USER_NOT_FOUND',
            message: 'User not found in room'
          })
          return
        }
        
        // Update user activity
        user.lastActivity = new Date()
        
        // Add metadata to operation
        const enrichedOperation: SecureElementOperation = {
          ...validatedOperation,
          userId: user.id,
          timestamp: Date.now(),
          version: validatedOperation.version || Date.now()
        }
        
        // Broadcast to other users in room
        socket.to(roomName).emit('element_operation', enrichedOperation)

      } catch (error: any) {
        logSecurityEvent('ELEMENT_OPERATION_VALIDATION_FAILED', {
          socketId: socket.id,
          operation,
          error: error.message,
          ipAddress,
          userAgent
        })
        socket.emit('error', {
          code: 'VALIDATION_ERROR',
          message: error.message
        })
      }
    })

    // Handle cursor movement with validation
    socket.on('cursor_move', (data: any) => {
      try {
        // Check rate limit
        if (!checkRateLimit(socket.id, 'cursor_move')) {
          return // Silently drop cursor updates if rate limited
        }
        
        // Validate cursor data
        const validatedData = validateSocketEvent(secureSocketCursorMoveSchema)(data)
        
        const roomName = userRooms.get(socket.id)
        if (!roomName) return
        
        const user = rooms.get(roomName)?.get(socket.id)
        if (!user) return
        
        // Update user's cursor position and activity
        user.cursor = { x: validatedData.x, y: validatedData.y }
        user.lastActivity = new Date()
        
        // Broadcast cursor movement to other users
        socket.to(roomName).emit('cursor_move', {
          userId: user.id,
          userName: user.name,
          userColor: user.color,
          cursor: validatedData
        })
        
      } catch (error: any) {
        logSecurityEvent('CURSOR_MOVE_VALIDATION_FAILED', {
          socketId: socket.id,
          data,
          error: error.message,
          ipAddress,
          userAgent
        })
        // Silently drop invalid cursor updates
      }
    })

    // Handle element dragging with validation
    socket.on('element_drag_start', (data: any) => {
      try {
        const validatedData = validateSocketEvent(secureSocketElementDragSchema)(data)
        
        const roomName = userRooms.get(socket.id)
        if (!roomName) return
        
        const user = rooms.get(roomName)?.get(socket.id)
        if (!user) return
        
        user.lastActivity = new Date()
        
        socket.to(roomName).emit('element_drag_start', {
          userId: user.id,
          userName: user.name,
          userColor: user.color,
          elementId: validatedData.elementId,
          position: { x: validatedData.x, y: validatedData.y }
        })
        
      } catch (error: any) {
        logSecurityEvent('ELEMENT_DRAG_START_VALIDATION_FAILED', {
          socketId: socket.id,
          data,
          error: error.message,
          ipAddress,
          userAgent
        })
      }
    })

    socket.on('element_drag_move', (data: any) => {
      try {
        const validatedData = validateSocketEvent(secureSocketElementDragSchema)(data)
        
        const roomName = userRooms.get(socket.id)
        if (!roomName) return
        
        const user = rooms.get(roomName)?.get(socket.id)
        if (!user) return
        
        user.lastActivity = new Date()
        
        socket.to(roomName).emit('element_drag_move', {
          userId: user.id,
          userName: user.name,
          userColor: user.color,
          elementId: validatedData.elementId,
          position: { x: validatedData.x, y: validatedData.y }
        })
        
      } catch (error: any) {
        logSecurityEvent('ELEMENT_DRAG_MOVE_VALIDATION_FAILED', {
          socketId: socket.id,
          data,
          error: error.message,
          ipAddress,
          userAgent
        })
      }
    })

    socket.on('element_drag_end', (data: any) => {
      try {
        const validatedData = validateSocketEvent(secureSocketElementDragSchema)(data)
        
        const roomName = userRooms.get(socket.id)
        if (!roomName) return
        
        const user = rooms.get(roomName)?.get(socket.id)
        if (!user) return
        
        user.lastActivity = new Date()
        
        socket.to(roomName).emit('element_drag_end', {
          userId: user.id,
          userName: user.name,
          userColor: user.color,
          elementId: validatedData.elementId,
          position: { x: validatedData.x, y: validatedData.y }
        })
        
      } catch (error: any) {
        logSecurityEvent('ELEMENT_DRAG_END_VALIDATION_FAILED', {
          socketId: socket.id,
          data,
          error: error.message,
          ipAddress,
          userAgent
        })
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      const roomName = userRooms.get(socket.id)
      if (roomName) {
        const user = rooms.get(roomName)?.get(socket.id)
        if (user) {
          // Notify other users
          socket.to(roomName).emit('user_left', {
            userId: user.id,
            userName: user.name
          })
        }
        removeUserFromRoom(socket.id, roomName)
      }
      userRooms.delete(socket.id)

    })
  })

  return io
}

// Helper function to remove user from room
const removeUserFromRoom = (socketId: string, roomName: string) => {
  const room = rooms.get(roomName)
  if (room) {
    room.delete(socketId)
    if (room.size === 0) {
      rooms.delete(roomName)
    }
  }
}

// Helper function to get room users
export const getSecureRoomUsers = (designId: string): SecureRoomUser[] => {
  const roomName = `design:${designId}`
  const room = rooms.get(roomName)
  return room ? Array.from(room.values()) : []
}

// Cleanup inactive users
setInterval(() => {
  const now = new Date()
  const inactiveThreshold = 5 * 60 * 1000 // 5 minutes
  
  for (const [roomName, room] of rooms.entries()) {
    for (const [socketId, user] of room.entries()) {
      if (now.getTime() - user.lastActivity.getTime() > inactiveThreshold) {
        logSecurityEvent('INACTIVE_USER_CLEANUP', {
          socketId,
          userId: user.id,
          roomName,
          lastActivity: user.lastActivity
        })
        room.delete(socketId)
        userRooms.delete(socketId)
      }
    }
    
    if (room.size === 0) {
      rooms.delete(roomName)
    }
  }
}, 60 * 1000) // Check every minute
