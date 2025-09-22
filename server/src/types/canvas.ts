export interface Canvas {
  id: string
  name: string
  description: string
  canvasData: CanvasData
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CanvasData {
  width?: number
  height?: number
  backgroundColor?: string
  elements?: CanvasElement[]
  version?: string
}

export interface CanvasElement {
  id: string
  type: 'rect' | 'circle' | 'text' | 'image' | 'line' | 'path'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  rotation?: number
  scaleX?: number
  scaleY?: number
  visible?: boolean
  locked?: boolean
  data?: any // Additional element-specific data
}

export interface CreateCanvasRequest {
  name: string
  description?: string
  canvasData?: CanvasData
}

export interface UpdateCanvasRequest {
  name?: string
  description?: string
  canvasData?: CanvasData
}

export interface ExportCanvasRequest {
  format: 'json' | 'svg' | 'png' | 'jpg'
}

export interface SaveImageRequest {
  imageData: string // Base64 encoded image data
  format?: 'png' | 'jpg' | 'jpeg'
}
