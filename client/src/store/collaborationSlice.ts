import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from '../types/collaboration'

interface CollaborationState {
  roomUsers: User[]
  currentUser: User | null
  isConnected: boolean
}

const initialState: CollaborationState = {
  roomUsers: [],
  currentUser: null,
  isConnected: false
}

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    setRoomUsers: (state, action: PayloadAction<User[]>) => {
      state.roomUsers = action.payload
    },
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload
    },
    setIsConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
    },
    addUser: (state, action: PayloadAction<User>) => {
      const existingIndex = state.roomUsers.findIndex(user => user.id === action.payload.id)
      if (existingIndex === -1) {
        state.roomUsers.push(action.payload)
      }
    },
    removeUser: (state, action: PayloadAction<string>) => {
      state.roomUsers = state.roomUsers.filter(user => user.id !== action.payload)
    }
  }
})

export const {
  setRoomUsers,
  setCurrentUser,
  setIsConnected,
  addUser,
  removeUser
} = collaborationSlice.actions

export default collaborationSlice.reducer
