import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../store'
import { addElement, updateElement, removeElement } from '../store/canvasSlice'
import { refreshDesign } from '../store/designsSlice'

interface User {
  id: string
  name: string
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
    if (!designId) return

    // Create socket connection
    const socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
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
      console.error('❌ useCollaboration: Connection error:', error)
      setState(prev => ({ ...prev, isConnected: false }))
      isJoiningRef.current = false
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
      // Don't process our own operations
      if (operation.userId === currentUserRef.current?.id) {
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
              dispatch(updateElement({ id: operation.elementId, updates: operation.updates }))
            }
            break
        }
      } catch (error) {
        console.error('❌ useCollaboration: Error processing element operation:', error)
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
      console.error('❌ useCollaboration: Socket error:', error)
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
  }, [designId, userName, dispatch])

  // Broadcast element operations
  const broadcastElementOperation = useCallback((operation: Omit<ElementOperation, 'userId' | 'timestamp' | 'designId'>) => {
    if (!state.socket || !state.isConnected || !designId || !currentUserRef.current) {
      return
    }

    const fullOperation: ElementOperation = {
      ...operation,
      designId,
      userId: currentUserRef.current.id,
      timestamp: Date.now()
    }

    state.socket.emit('element_operation', fullOperation)
  }, [state.socket, state.isConnected, designId])

  // Broadcast cursor movement
  const broadcastCursorMove = useCallback((x: number, y: number) => {
    if (!state.socket || !state.isConnected || !designId) {
      return
    }

    state.socket.emit('cursor_move', { designId, x, y })
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
    broadcastRefreshSignal
  }
}
