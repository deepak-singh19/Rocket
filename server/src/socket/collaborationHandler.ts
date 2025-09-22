import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

interface User {
  id: string
  name: string
  designId: string
  cursor?: { x: number; y: number }
}

interface ElementOperation {
  type: 'element_added' | 'element_updated' | 'element_deleted' | 'element_moved'
  designId: string
  elementId: string
  element?: any
  updates?: any
  userId: string
  timestamp: number
}

class CollaborationHandler {
  private io: SocketIOServer
  private users: Map<string, User> = new Map()
  private designRooms: Map<string, Set<string>> = new Map()

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    })

    this.setupEventHandlers()

  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {

      // User joins a design room
      socket.on('join_design', (data: { designId: string; userName: string }) => {
        try {
          const { designId, userName } = data
          
          // Validate input
          if (!designId || !userName) {
            socket.emit('error', { message: 'Missing designId or userName' })
            return
          }

          // Leave previous room if any
          const previousUser = this.users.get(socket.id)
          if (previousUser) {
            this.leaveRoom(socket, previousUser.designId)
          }

          // Join new room
          this.joinRoom(socket, designId, userName)

        } catch (error) {
          console.error('❌ Error in join_design:', error)
          socket.emit('error', { message: 'Failed to join design' })
        }
      })

      // User leaves a design room
      socket.on('leave_design', (data: { designId: string }) => {
        try {
          const { designId } = data
          this.leaveRoom(socket, designId)

        } catch (error) {
          console.error('❌ Error in leave_design:', error)
        }
      })

      // Element operations (add, update, delete, move)
      socket.on('element_operation', (data: ElementOperation) => {
        try {
          const { designId, elementId, type, element, updates, userId } = data
          
          console.log('🔄 Server: Received element_operation:', {
            type,
            elementId,
            updates,
            userId,
            designId
          })

          // Validate input
          if (!designId || !elementId || !type || !userId) {
            console.log('❌ Server: Missing required fields')
            socket.emit('error', { message: 'Missing required fields' })
            return
          }

          // Check if user is in the room
          const user = this.users.get(socket.id)
          if (!user || user.designId !== designId) {
            console.log('❌ Server: User not in design room')
            socket.emit('error', { message: 'User not in design room' })
            return
          }

          // Broadcast to other users in the room
          const operation: ElementOperation = {
            ...data,
            timestamp: Date.now()
          }

          // Check how many users are in the room
          const roomUsers = Array.from(this.users.values()).filter(u => u.designId === designId)
          console.log('🚀 Server: Broadcasting element_operation to room:', designId, 'with', roomUsers.length, 'total users')
          console.log('🚀 Server: Room users:', roomUsers.map(u => ({ id: u.id, name: u.name })))
          
          socket.to(designId).emit('element_operation', operation)

        } catch (error) {
          console.error('❌ Error in element_operation:', error)
          socket.emit('error', { message: 'Failed to process element operation' })
        }
      })

      // Cursor movement
      socket.on('cursor_move', (data: { designId: string; x: number; y: number }) => {
        try {
          const { designId, x, y } = data
          const user = this.users.get(socket.id)
          
          if (user && user.designId === designId) {
            user.cursor = { x, y }
            
            // Broadcast cursor position to other users
            socket.to(designId).emit('user_cursor', {
              userId: socket.id,
              userName: user.name,
              cursor: { x, y }
            })
          }
        } catch (error) {
          console.error('❌ Error in cursor_move:', error)
        }
      })

      // Element selection
      socket.on('user_selection', (data: { designId: string; elementId: string | null; userId: string; userName: string }) => {
        try {
          const { designId, elementId } = data
          const user = this.users.get(socket.id)
          
          if (user && user.designId === designId) {
            // Broadcast selection to other users in the room
            socket.to(designId).emit('user_selection', {
              userId: socket.id,
              userName: user.name,
              elementId: elementId
            })
          }
        } catch (error) {
          console.error('❌ Error in user_selection:', error)
        }
      })

      // Refresh signal - notify other users to refresh their data
      socket.on('refresh_signal', (data: { designId: string; userId: string; userName: string }) => {
        try {
          const { designId, userId, userName } = data
          
          // Validate input
          if (!designId || !userId || !userName) {
            socket.emit('error', { message: 'Missing required fields for refresh signal' })
            return
          }

          // Check if user is in the room
          const user = this.users.get(socket.id)
          if (!user || user.designId !== designId) {
            socket.emit('error', { message: 'User not in design room' })
            return
          }

          // Broadcast refresh signal to other users in the room
          socket.to(designId).emit('refresh_signal', {
            designId,
            userId,
            userName
          })

        } catch (error) {
          console.error('❌ Error in refresh_signal:', error)
          socket.emit('error', { message: 'Failed to process refresh signal' })
        }
      })

      // Comment events for real-time updates
      socket.on('comment_created', (data: { designId: string; comment: any; userId: string; userName: string }) => {
        try {
          const { designId, comment, userId, userName } = data
          
          // Validate input
          if (!designId || !comment || !userId || !userName) {
            console.warn('⚠️ Invalid comment creation data:', data)
            return
          }
          
          // Broadcast comment creation to other users in the room
          socket.to(designId).emit('comment_created', {
            designId,
            comment,
            userId,
            userName
          })

        } catch (error) {
          console.error('❌ Error in comment_created:', error)
          socket.emit('error', { message: 'Failed to process comment creation' })
        }
      })

      socket.on('comment_updated', (data: { designId: string; comment: any; userId: string; userName: string }) => {
        try {
          const { designId, comment, userId, userName } = data
          
          // Validate input
          if (!designId || !comment || !userId || !userName) {
            console.warn('⚠️ Invalid comment update data:', data)
            return
          }
          
          // Broadcast comment update to other users in the room
          socket.to(designId).emit('comment_updated', {
            designId,
            comment,
            userId,
            userName
          })

        } catch (error) {
          console.error('❌ Error in comment_updated:', error)
          socket.emit('error', { message: 'Failed to process comment update' })
        }
      })

      socket.on('comment_deleted', (data: { designId: string; commentId: string; userId: string; userName: string }) => {
        try {
          const { designId, commentId, userId, userName } = data
          
          // Validate input
          if (!designId || !commentId || !userId || !userName) {
            console.warn('⚠️ Invalid comment deletion data:', data)
            return
          }
          
          // Broadcast comment deletion to other users in the room
          socket.to(designId).emit('comment_deleted', {
            designId,
            commentId,
            userId,
            userName
          })

        } catch (error) {
          console.error('❌ Error in comment_deleted:', error)
          socket.emit('error', { message: 'Failed to process comment deletion' })
        }
      })

      socket.on('comment_resolved', (data: { designId: string; commentId: string; isResolved: boolean; userId: string; userName: string }) => {
        try {
          const { designId, commentId, isResolved, userId, userName } = data
          
          // Validate input
          if (!designId || !commentId || isResolved === undefined || !userId || !userName) {
            console.warn('⚠️ Invalid comment resolution data:', data)
            return
          }
          
          // Broadcast comment resolution to other users in the room
          socket.to(designId).emit('comment_resolved', {
            designId,
            commentId,
            isResolved,
            userId,
            userName
          })

        } catch (error) {
          console.error('❌ Error in comment_resolved:', error)
          socket.emit('error', { message: 'Failed to process comment resolution' })
        }
      })

      // User disconnects
      socket.on('disconnect', () => {
        try {
          const user = this.users.get(socket.id)
          if (user) {
            this.leaveRoom(socket, user.designId)
          }
          this.users.delete(socket.id)

        } catch (error) {
          console.error('❌ Error in disconnect:', error)
        }
      })
    })
  }

  private joinRoom(socket: any, designId: string, userName: string) {
    // Add user to room
    socket.join(designId)
    
    // Store user info
    const user: User = {
      id: socket.id,
      name: userName,
      designId: designId
    }
    this.users.set(socket.id, user)

    // Add to design room
    if (!this.designRooms.has(designId)) {
      this.designRooms.set(designId, new Set())
    }
    this.designRooms.get(designId)!.add(socket.id)

    // Get current users in room
    const roomUsers = Array.from(this.designRooms.get(designId) || [])
      .map(userId => {
        const user = this.users.get(userId)
        return user ? { id: user.id, name: user.name, cursor: user.cursor } : null
      })
      .filter(Boolean)

    // Notify user of successful join
    socket.emit('joined_design', {
      designId,
      users: roomUsers
    })

    // Notify other users in room
    socket.to(designId).emit('user_joined', {
      userId: socket.id,
      userName: userName
    })
  }

  private leaveRoom(socket: any, designId: string) {
    // Remove from room
    socket.leave(designId)
    
    // Remove from design room
    const roomUsers = this.designRooms.get(designId)
    if (roomUsers) {
      roomUsers.delete(socket.id)
      if (roomUsers.size === 0) {
        this.designRooms.delete(designId)
      }
    }

    // Notify other users in room
    socket.to(designId).emit('user_left', {
      userId: socket.id
    })
  }

  // Get current users in a design room
  getUsersInRoom(designId: string): User[] {
    const roomUsers = this.designRooms.get(designId)
    if (!roomUsers) return []

    return Array.from(roomUsers)
      .map(userId => this.users.get(userId))
      .filter(Boolean) as User[]
  }

  // Get total connected users
  getTotalUsers(): number {
    return this.users.size
  }
}

export default CollaborationHandler
