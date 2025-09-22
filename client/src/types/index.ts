// Design types
export interface Design {
  _id: string
  name: string
  width: number
  height: number
  createdBy: string
  updatedAt: string
  elements: DesignElements
  layers: Layer[]
  comments: Comment[]
  thumbnail?: string
}

export interface DesignElements {
  canvas: {
    width: number
    height: number
    backgroundColor: string
  }
  objects: CanvasElement[]
}

export interface Layer {
  name: string
  order: number
}

export interface Comment {
  _id: string
  designId: string
  userId: string
  userName: string
  userEmail: string
  content: string
  mentions: Array<{
    userId: string
    userName: string
    userEmail: string
  }>
  position?: {
    x: number
    y: number
  }
  elementId?: string // If comment is attached to a specific element
  parentId?: string // For threaded replies
  isResolved: boolean
  createdAt: string
  updatedAt: string
  editedAt?: string
  replyCount?: number // Number of replies (for UI)
}

// Drawing tool types
export type DrawingTool = 'pencil' | 'pen' | 'none'

export interface DrawingState {
  tool: DrawingTool
  color: string
  strokeWidth: number
  isDrawing: boolean
  currentPath: string | null
}

// Canvas element types
export interface CanvasElement {
  id: string
  type: 'rect' | 'circle' | 'text' | 'image' | 'line' | 'path' | 'drawing'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: 'normal' | 'bold'
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  rotation?: number
  scaleX?: number
  scaleY?: number
  visible?: boolean
  locked?: boolean
  zIndex?: number // Layer order (higher = on top)
  src?: string // for images
  borderRadius?: number // for images and rects
  fitMode?: 'cover' | 'contain' // for images
  data?: any // Additional element-specific data
  version?: number // Element version for conflict resolution
  lastModified?: Date | string // Last modification timestamp
  // Drawing-specific properties
  pathData?: string // SVG path data for drawings
  tool?: DrawingTool // Drawing tool used
}

// Canvas state types
export interface CanvasState {
  elements: CanvasElement[]
  selectedElement: string | null
  history: CanvasElement[][]
  historyIndex: number
  maxHistorySize: number
  canvasSize: {
    width: number
    height: number
  }
  zoom: number
  pan: {
    x: number
    y: number
  }
  drawing: DrawingState
}

// Design state types
export interface DesignState {
  designs: Design[]
  selectedDesign: Design | null
  loading: boolean
  error: string | null
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Action types
export interface CreateDesignRequest {
  name: string
  width: number
  height: number
  createdBy: string
  elements?: DesignElements
  layers?: Layer[]
  thumbnail?: string
}

export interface UpdateDesignRequest {
  name?: string
  width?: number
  height?: number
  elements?: DesignElements
  layers?: Layer[]
  thumbnail?: string
}

export interface User {
  id: string
  name: string
  email: string
}

// Sync types
export interface SyncRequest {
  clientVersion?: number
  lastSyncAt?: string
}

export interface SyncResponse {
  success: boolean
  data: {
    designId: string
    version: number
    lastSyncAt: string
    needsFullSync: boolean
    design?: Design
    elementVersions: Array<{
      id: string
      version: number
      lastModified: string
    }>
  }
}

export interface ElementVersion {
  id: string
  version: number
  lastModified: string
}

// Comment API types
export interface CreateCommentRequest {
  designId: string
  content: string
  mentions: Array<{
    userId: string
    userName: string
    userEmail: string
  }>
  position?: {
    x: number
    y: number
  }
  elementId?: string
  parentId?: string
}

export interface UpdateCommentRequest {
  content: string
  mentions: Array<{
    userId: string
    userName: string
    userEmail: string
  }>
}

export interface CommentFilters {
  resolved?: boolean
  elementId?: string
  parentId?: string
  page?: number
  limit?: number
}
