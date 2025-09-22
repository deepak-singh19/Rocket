export interface User {
  id: string
  name: string
  color: string
  cursor?: { x: number; y: number }
}

export interface CollaborationEvent {
  type: 'element_added' | 'element_updated' | 'element_deleted' | 'element_moved' | 'element_transformed' | 'cursor_moved' | 'user_joined' | 'user_left'
  designId: string
  userId: string
  timestamp: number
  data: any
  version?: number
}

export interface ElementOperation extends CollaborationEvent {
  elementId: string
  element?: any
  updates?: any
}

export interface CursorMoveEvent {
  userId: string
  userName: string
  userColor: string
  cursor: { x: number; y: number }
}

export interface ElementDragEvent {
  userId: string
  userName: string
  userColor: string
  elementId: string
  position: { x: number; y: number }
}

export interface GhostElement {
  id: string
  elementId: string
  userId: string
  userName: string
  userColor: string
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  type: string
}

export interface CollaborationState {
  isConnected: boolean
  currentUser: User | null
  roomUsers: User[]
  ghostElements: GhostElement[]
  userCursors: Map<string, { x: number; y: number; color: string; name: string }>
  lastOperationVersion: number
}
