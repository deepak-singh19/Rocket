import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../store'
import { addElement, updateElement, removeElement, bringToFront, sendToBack, bringForward, sendBackward } from '../store/canvasSlice'
import { refreshDesign } from '../store/designsSlice'

interface User {
  id: string
  name: string
  cursor?: { x: number; y: number }
  selectedElement?: string | null
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

// SelectionOperation interface for future use
// interface SelectionOperation {
//   type: 'element_selected' | 'element_deselected'
//   designId: string
//   elementId: string | null
//   userId: string
//   userName: string
//   timestamp: number
// }

interface CollaborationState {
  isConnected: boolean
  socket: Socket | null
  users: User[]
  currentUser: User | null
}

export interface CollaborationHookReturn {
  isConnected: boolean
  socket: Socket | null
  users: User[]
  currentUser: User | null
  broadcastElementOperation: (operation: Omit<ElementOperation, 'userId' | 'timestamp' | 'designId'>) => void
  broadcastCursorMove: (x: number, y: number) => void
  broadcastElementSelection: (elementId: string | null) => void
  broadcastRefreshSignal: () => void
}

export const useCollaboration = (designId: string | null, userName: string = 'User') => {
  const dispatch = useDispatch<AppDispatch>()
  
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    socket: null,
    users: [],
    currentUser: null
  })

  const socketRef = useRef<Socket | null>(null)
  const isJoiningRef = useRef(false)
  const currentUserRef = useRef<User | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!designId) {
      // Reset state when no design
      setState({
        isConnected: false,
        socket: null,
        users: [],
        currentUser: null
      })
      return
    }

    // Initialize socket connection
    const connectSocket = () => {
      // Create socket connection
      const socket = io((import.meta.env as any).VITE_API_URL?.replace('/api', '') || 'http://localhost:4000', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      setState(prev => ({ ...prev, isConnected: true, socket }))
      
      // Join design room
      if (!isJoiningRef.current) {
        isJoiningRef.current = true
        socket.emit('join_design', { designId, userName })
      }
    })

    socket.on('disconnect', () => {
      setState(prev => ({ ...prev, isConnected: false, users: [], currentUser: null }))
      isJoiningRef.current = false
    })

    socket.on('connect_error', (error) => {
      console.error('useCollaboration: Connection error:', error)
      setState(prev => ({ ...prev, isConnected: false }))
      isJoiningRef.current = false
    })

        socket.on('reconnect', () => {
      // Re-join design room after reconnection
      if (designId && !isJoiningRef.current) {
        isJoiningRef.current = true
        socket.emit('join_design', { designId, userName })
      }
    })

    socket.on('reconnect_error', (error) => {
      console.error('useCollaboration: Reconnection error:', error)
    })

    // Room events
    socket.on('joined_design', (data: { designId: string; users: User[] }) => {
      const currentUser = data.users.find(u => u.name === userName) || null
      currentUserRef.current = currentUser
      setState(prev => ({
        ...prev,
        users: data.users,
        currentUser
      }))
      isJoiningRef.current = false
    })

    socket.on('user_joined', (data: { userId: string; userName: string }) => {
      setState(prev => ({
        ...prev,
        users: [...prev.users, { id: data.userId, name: data.userName }]
      }))
    })

    socket.on('user_left', (data: { userId: string }) => {
      setState(prev => ({
        ...prev,
        users: prev.users.filter(user => user.id !== data.userId)
      }))
    })

    // Element operation events
    socket.on('element_operation', (operation: ElementOperation) => {
      console.log('useCollaboration: Received element_operation from server:', operation)
      
      // Don't process our own operations
      if (operation.userId === currentUserRef.current?.id) {
        console.log(' useCollaboration: Ignoring own operation')
        return
      }

      try {
        switch (operation.type) {
          case 'element_added':
            if (operation.element) {
              dispatch(addElement(operation.element))
            }
            break
            
          case 'element_updated':
            if (operation.updates) {
              dispatch(updateElement({ id: operation.elementId, updates: operation.updates }))
            }
            break
            
          case 'element_deleted':
            dispatch(removeElement(operation.elementId))
            break
            
          case 'element_moved':
            if (operation.updates) {
              // Handle z-index operations
              if (operation.updates.zIndex) {
                console.log(' useCollaboration: Processing z-index operation:', operation.updates.zIndex, 'for element:', operation.elementId)
                switch (operation.updates.zIndex) {
                  case 'front':
                    console.log(' useCollaboration: Bringing to front')
                    dispatch(bringToFront(operation.elementId))
                    break
                  case 'back':
                    console.log(' useCollaboration: Sending to back')
                    dispatch(sendToBack(operation.elementId))
                    break
                  case 'forward':
                    console.log(' useCollaboration: Moving forward')
                    dispatch(bringForward(operation.elementId))
                    break
                  case 'backward':
                    console.log('useCollaboration: Moving backward')
                    dispatch(sendBackward(operation.elementId))
                    break
                  default:
                    console.log(' useCollaboration: Unknown z-index operation:', operation.updates.zIndex)
                    // Regular position update
                    dispatch(updateElement({ id: operation.elementId, updates: operation.updates }))
                }
              } else {
                // Regular position update
                dispatch(updateElement({ id: operation.elementId, updates: operation.updates }))
              }
            }
            break
        }
      } catch (error) {
        console.error('useCollaboration: Error processing element operation:', error)
      }
    })

    // Cursor events
    socket.on('user_cursor', (data: { userId: string; userName: string; cursor: { x: number; y: number } }) => {
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === data.userId 
            ? { ...user, cursor: data.cursor }
            : user
        )
      }))
    })

    // Selection events
    socket.on('user_selection', (data: { userId: string; userName: string; elementId: string | null }) => {
      // Don't process our own selections
      if (data.userId === currentUserRef.current?.id) {
        return
      }

      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === data.userId 
            ? { ...user, selectedElement: data.elementId }
            : user
        )
      }))
    })

    // Refresh signal events
    socket.on('refresh_signal', (data: { userId: string; userName: string; designId: string }) => {
      // Don't process our own refresh signals
      if (data.userId === currentUserRef.current?.id) {
        return
      }

      dispatch(refreshDesign(data.designId))
    })

    // Error handling
    socket.on('error', (error: { code: string; message: string }) => {
      console.error('useCollaboration: Socket error:', error)
    })

      // Cleanup on unmount or design change
      return () => {
        if (socketRef.current) {
          socketRef.current.emit('leave_design', { designId })
          socketRef.current.disconnect()
          socketRef.current = null
        }
        currentUserRef.current = null
        setState({
          isConnected: false,
          socket: null,
          users: [],
          currentUser: null
        })
        isJoiningRef.current = false
      }
    }

    // Connect immediately if design is loaded, otherwise with small delay
    const initTimer = setTimeout(connectSocket, designId ? 50 : 100)

    // Cleanup function
    return () => {
      clearTimeout(initTimer)
      if (socketRef.current) {
        socketRef.current.emit('leave_design', { designId })
        socketRef.current.disconnect()
        socketRef.current = null
      }
      currentUserRef.current = null
      setState({
        isConnected: false,
        socket: null,
        users: [],
        currentUser: null
      })
      isJoiningRef.current = false
    }
  }, [designId, userName, dispatch])

  // Broadcast element operations
  const broadcastElementOperation = useCallback((operation: Omit<ElementOperation, 'userId' | 'timestamp' | 'designId'>) => {
    console.log(' useCollaboration: Broadcasting operation:', operation)
    if (!state.socket || !state.isConnected || !designId || !currentUserRef.current) {
      console.log('useCollaboration: Cannot broadcast - not ready:', {
        hasSocket: !!state.socket,
        isConnected: state.isConnected,
        hasDesignId: !!designId,
        hasCurrentUser: !!currentUserRef.current
      })
      return
    }

    const fullOperation: ElementOperation = {
      ...operation,
      designId,
      userId: currentUserRef.current.id,
      timestamp: Date.now()
    }

    console.log('useCollaboration: Emitting element_operation:', fullOperation)
    state.socket.emit('element_operation', fullOperation)
  }, [state.socket, state.isConnected, designId])

  // Broadcast cursor movement
  const broadcastCursorMove = useCallback((x: number, y: number) => {
    if (!state.socket || !state.isConnected || !designId) {
      return
    }

    state.socket.emit('cursor_move', { designId, x, y })
  }, [state.socket, state.isConnected, designId])

  // Broadcast element selection
  const broadcastElementSelection = useCallback((elementId: string | null) => {
    if (!state.socket || !state.isConnected || !designId || !currentUserRef.current) {
      return
    }

    state.socket.emit('user_selection', {
      designId,
      elementId,
      userId: currentUserRef.current.id,
      userName: currentUserRef.current.name
    })
  }, [state.socket, state.isConnected, designId])

  // Broadcast refresh signal to other clients
  const broadcastRefreshSignal = useCallback(() => {
    if (!state.socket || !state.isConnected || !designId || !currentUserRef.current) {
      return
    }

    state.socket.emit('refresh_signal', {
      designId,
      userId: currentUserRef.current.id,
      userName: currentUserRef.current.name
    })
  }, [state.socket, state.isConnected, designId])

  return {
    isConnected: state.isConnected,
    socket: state.socket,
    users: state.users,
    currentUser: state.currentUser,
    broadcastElementOperation,
    broadcastCursorMove,
    broadcastElementSelection,
    broadcastRefreshSignal
  }
}
