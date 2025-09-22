import { describe, it, expect } from 'vitest'
import collaborationReducer, {
  setRoomUsers,
  setCurrentUser,
  setIsConnected,
  addUser,
  removeUser
} from '../collaborationSlice'
import { User } from '../../types/collaboration'

describe('collaborationSlice', () => {
  const mockUser: User = {
    id: 'user-1',
    name: 'John Doe',
    color: '#ff0000',
    cursor: { x: 100, y: 200 },
    isDragging: false,
    draggingElementId: null
  }

  const mockUser2: User = {
    id: 'user-2',
    name: 'Jane Smith',
    color: '#00ff00',
    cursor: { x: 300, y: 400 },
    isDragging: true,
    draggingElementId: 'element-1'
  }

  const initialState = {
    roomUsers: [],
    currentUser: null,
    isConnected: false
  }

  describe('setRoomUsers', () => {
    it('should set room users', () => {
      const users = [mockUser, mockUser2]
      const action = setRoomUsers(users)
      const newState = collaborationReducer(initialState, action)

      expect(newState.roomUsers).toEqual(users)
    })

    it('should replace existing room users', () => {
      const stateWithUsers = {
        ...initialState,
        roomUsers: [mockUser]
      }
      const newUsers = [mockUser2]
      const action = setRoomUsers(newUsers)
      const newState = collaborationReducer(stateWithUsers, action)

      expect(newState.roomUsers).toEqual(newUsers)
    })
  })

  describe('setCurrentUser', () => {
    it('should set current user', () => {
      const action = setCurrentUser(mockUser)
      const newState = collaborationReducer(initialState, action)

      expect(newState.currentUser).toEqual(mockUser)
    })

    it('should clear current user when set to null', () => {
      const stateWithUser = {
        ...initialState,
        currentUser: mockUser
      }
      const action = setCurrentUser(null)
      const newState = collaborationReducer(stateWithUser, action)

      expect(newState.currentUser).toBe(null)
    })
  })

  describe('setIsConnected', () => {
    it('should set connection status to true', () => {
      const action = setIsConnected(true)
      const newState = collaborationReducer(initialState, action)

      expect(newState.isConnected).toBe(true)
    })

    it('should set connection status to false', () => {
      const stateConnected = {
        ...initialState,
        isConnected: true
      }
      const action = setIsConnected(false)
      const newState = collaborationReducer(stateConnected, action)

      expect(newState.isConnected).toBe(false)
    })
  })

  describe('addUser', () => {
    it('should add a new user to room users', () => {
      const action = addUser(mockUser)
      const newState = collaborationReducer(initialState, action)

      expect(newState.roomUsers).toHaveLength(1)
      expect(newState.roomUsers[0]).toEqual(mockUser)
    })

    it('should not add duplicate user', () => {
      const stateWithUser = {
        ...initialState,
        roomUsers: [mockUser]
      }
      const action = addUser(mockUser)
      const newState = collaborationReducer(stateWithUser, action)

      expect(newState.roomUsers).toHaveLength(1)
      expect(newState.roomUsers[0]).toEqual(mockUser)
    })

    it('should add multiple users', () => {
      const action1 = addUser(mockUser)
      const action2 = addUser(mockUser2)
      
      let state = collaborationReducer(initialState, action1)
      state = collaborationReducer(state, action2)

      expect(state.roomUsers).toHaveLength(2)
      expect(state.roomUsers).toContain(mockUser)
      expect(state.roomUsers).toContain(mockUser2)
    })
  })

  describe('removeUser', () => {
    it('should remove user by id', () => {
      const stateWithUsers = {
        ...initialState,
        roomUsers: [mockUser, mockUser2]
      }
      const action = removeUser(mockUser.id)
      const newState = collaborationReducer(stateWithUsers, action)

      expect(newState.roomUsers).toHaveLength(1)
      expect(newState.roomUsers[0]).toEqual(mockUser2)
    })

    it('should not remove non-existent user', () => {
      const stateWithUsers = {
        ...initialState,
        roomUsers: [mockUser]
      }
      const action = removeUser('non-existent-id')
      const newState = collaborationReducer(stateWithUsers, action)

      expect(newState.roomUsers).toHaveLength(1)
      expect(newState.roomUsers[0]).toEqual(mockUser)
    })

    it('should handle removing user from empty list', () => {
      const action = removeUser(mockUser.id)
      const newState = collaborationReducer(initialState, action)

      expect(newState.roomUsers).toHaveLength(0)
    })
  })

  describe('combined operations', () => {
    it('should handle user joining and leaving', () => {
      // User joins
      const addAction = addUser(mockUser)
      let state = collaborationReducer(initialState, addAction)

      expect(state.roomUsers).toHaveLength(1)
      expect(state.roomUsers[0]).toEqual(mockUser)

      // User leaves
      const removeAction = removeUser(mockUser.id)
      state = collaborationReducer(state, removeAction)

      expect(state.roomUsers).toHaveLength(0)
    })

    it('should handle multiple users joining and leaving', () => {
      // Multiple users join
      const addUser1Action = addUser(mockUser)
      const addUser2Action = addUser(mockUser2)
      
      let state = collaborationReducer(initialState, addUser1Action)
      state = collaborationReducer(state, addUser2Action)

      expect(state.roomUsers).toHaveLength(2)

      // One user leaves
      const removeAction = removeUser(mockUser.id)
      state = collaborationReducer(state, removeAction)

      expect(state.roomUsers).toHaveLength(1)
      expect(state.roomUsers[0]).toEqual(mockUser2)
    })

    it('should handle connection status changes with users', () => {
      // Connect and add users
      const connectAction = setIsConnected(true)
      const addUserAction = addUser(mockUser)
      
      let state = collaborationReducer(initialState, connectAction)
      state = collaborationReducer(state, addUserAction)

      expect(state.isConnected).toBe(true)
      expect(state.roomUsers).toHaveLength(1)

      // Disconnect
      const disconnectAction = setIsConnected(false)
      state = collaborationReducer(state, disconnectAction)

      expect(state.isConnected).toBe(false)
      expect(state.roomUsers).toHaveLength(1) // Users remain in state
    })
  })
})
