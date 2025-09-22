import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { produce } from 'immer'
import { CanvasElement, CanvasState, DrawingTool } from '../types'
import { generateElementId } from '../utils/uuid'

// Initial state
const initialState: CanvasState = {
  elements: [],
  selectedElement: null,
  history: [[]],
  historyIndex: 0,
  maxHistorySize: 50,
  canvasSize: {
    width: 1080,
    height: 1080
  },
  zoom: 1,
  pan: {
    x: 0,
    y: 0
  },
  drawing: {
    tool: 'none',
    color: '#000000',
    strokeWidth: 2,
    isDrawing: false,
    currentPath: null
  }
}

// Pure helper function to create a deep copy of elements
const createElementsSnapshot = (elements: CanvasElement[]): CanvasElement[] => {
  return elements.map(element => ({ ...element }))
}

// Pure helper function to manage history
const manageHistory = (
  currentHistory: CanvasElement[][],
  currentIndex: number,
  newElements: CanvasElement[],
  maxHistorySize: number
): { history: CanvasElement[][]; historyIndex: number } => {
  const elementsSnapshot = createElementsSnapshot(newElements)
  
  // Remove any future history if we're not at the end
  const newHistory = currentHistory.slice(0, currentIndex + 1)
  newHistory.push(elementsSnapshot)
  
  // Limit history to maxHistorySize
  if (newHistory.length > maxHistorySize) {
    newHistory.shift()
    return {
      history: newHistory,
      historyIndex: newHistory.length - 1 // Set to last index
    }
  } else {
    return {
      history: newHistory,
      historyIndex: currentIndex + 1
    }
  }
}

// Pure helper function to find element index
const findElementIndex = (elements: CanvasElement[], id: string): number => {
  return elements.findIndex(el => el.id === id)
}

// Pure helper function to create element with defaults
const createElementWithDefaults = (
  baseElement: Partial<CanvasElement>,
  defaults: Partial<CanvasElement> = {},
  existingElements: CanvasElement[] = []
): CanvasElement => {
  const now = new Date().toISOString()
  const maxZIndex = Math.max(...existingElements.map(el => el.zIndex || 0), -1)
  return {
    id: baseElement.id || generateElementId(),
    type: baseElement.type || 'rect',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    opacity: 1,
    visible: true,
    locked: false,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    zIndex: baseElement.zIndex !== undefined ? baseElement.zIndex : maxZIndex + 1,
    version: 1,
    lastModified: baseElement.lastModified || now,
    ...defaults,
    ...baseElement
  } as CanvasElement
}

// Slice
const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    // Element management
    addElement: (state, action: PayloadAction<CanvasElement>) => {
      return produce(state, draft => {
        const element = {
          ...action.payload,
          version: action.payload.version || 1,
          lastModified: action.payload.lastModified || new Date().toISOString(),
          zIndex: action.payload.zIndex !== undefined ? action.payload.zIndex : Math.max(...draft.elements.map(el => el.zIndex || 0), -1) + 1
        }
        
        draft.elements.push(element)

        const historyResult = manageHistory(
          draft.history,
          draft.historyIndex,
          draft.elements,
          draft.maxHistorySize
        )
        draft.history = historyResult.history
        draft.historyIndex = historyResult.historyIndex
      })
    },
    
    updateElement: (state, action: PayloadAction<{ id: string; updates: Partial<CanvasElement> }>) => {
      return produce(state, draft => {
        const { id, updates } = action.payload
        const elementIndex = findElementIndex(draft.elements, id)
        
        if (elementIndex !== -1) {
          const currentElement = draft.elements[elementIndex]
          if (currentElement) {
            Object.assign(currentElement, updates)
            currentElement.version = (currentElement.version || 1) + 1
            currentElement.lastModified = new Date().toISOString()
          }
          
          const historyResult = manageHistory(
            draft.history,
            draft.historyIndex,
            draft.elements,
            draft.maxHistorySize
          )
          draft.history = historyResult.history
          draft.historyIndex = historyResult.historyIndex
        }
      })
    },
    
    removeElement: (state, action: PayloadAction<string>) => {
      return produce(state, draft => {
        const elementId = action.payload
        draft.elements = draft.elements.filter(el => el.id !== elementId)

        if (draft.selectedElement === elementId) {
          draft.selectedElement = null
        }
        
        const historyResult = manageHistory(
          draft.history,
          draft.historyIndex,
          draft.elements,
          draft.maxHistorySize
        )
        draft.history = historyResult.history
        draft.historyIndex = historyResult.historyIndex
      })
    },
    
    duplicateElement: (state, action: PayloadAction<string>) => {
      return produce(state, draft => {
        const elementId = action.payload
        const element = draft.elements.find(el => el.id === elementId)
        
        if (element) {
          const newElement = createElementWithDefaults({
            ...element,
            x: element.x + 20,
            y: element.y + 20
          })
          
          draft.elements.push(newElement)
          
          const historyResult = manageHistory(
            draft.history,
            draft.historyIndex,
            draft.elements,
            draft.maxHistorySize
          )
          draft.history = historyResult.history
          draft.historyIndex = historyResult.historyIndex
        }
      })
    },
    
    // Selection management
    selectElement: (state, action: PayloadAction<string | null>) => {

      return produce(state, draft => {
        draft.selectedElement = action.payload
      })
    },
    
    clearSelection: (state) => {
      return produce(state, draft => {
        draft.selectedElement = null
      })
    },
    
    // Canvas management
    setCanvasSize: (state, action: PayloadAction<{ width: number; height: number }>) => {
      return produce(state, draft => {
        draft.canvasSize = action.payload
      })
    },
    
    setZoom: (state, action: PayloadAction<number>) => {
      return produce(state, draft => {
        draft.zoom = Math.max(0.1, Math.min(5, action.payload)) // Limit zoom between 0.1x and 5x
      })
    },
    
    setPan: (state, action: PayloadAction<{ x: number; y: number }>) => {
      return produce(state, draft => {
        draft.pan = action.payload
      })
    },
    
    resetView: (state) => {
      return produce(state, draft => {
        draft.zoom = 1
        draft.pan = { x: 0, y: 0 }
      })
    },
    
    // History management
    undo: (state) => {
      return produce(state, draft => {
        if (draft.historyIndex > 0) {
          draft.historyIndex--
          const historySnapshot = draft.history[draft.historyIndex]
          if (historySnapshot) {
            draft.elements = createElementsSnapshot(historySnapshot)
          }
          draft.selectedElement = null
        }
      })
    },
    
    redo: (state) => {
      return produce(state, draft => {
        if (draft.historyIndex < draft.history.length - 1) {
          draft.historyIndex++
          const historySnapshot = draft.history[draft.historyIndex]
          if (historySnapshot) {
            draft.elements = createElementsSnapshot(historySnapshot)
          }
          draft.selectedElement = null
        }
      })
    },

    // Clear history (useful when loading new designs)
    clearHistory: (state) => {
      return produce(state, draft => {
        draft.history = [createElementsSnapshot(draft.elements)]
        draft.historyIndex = 0
      })
    },

    // Set max history size
    setMaxHistorySize: (state, action: PayloadAction<number>) => {
      return produce(state, draft => {
        const newMaxSize = Math.max(10, Math.min(100, action.payload)) // Limit between 10-100
        draft.maxHistorySize = newMaxSize
        
        // Trim history if new size is smaller
        if (draft.history.length > newMaxSize) {
          const excess = draft.history.length - newMaxSize
          draft.history = draft.history.slice(excess)
          draft.historyIndex = Math.max(0, draft.historyIndex - excess)
        }
      })
    },
    
    // Bulk operations
    clearCanvas: (state) => {
      return produce(state, draft => {
        draft.elements = []
        draft.selectedElement = null
        
        const historyResult = manageHistory(
          draft.history,
          draft.historyIndex,
          draft.elements,
          draft.maxHistorySize
        )
        draft.history = historyResult.history
        draft.historyIndex = historyResult.historyIndex
      })
    },
    
    loadElements: (state, action: PayloadAction<CanvasElement[]>) => {
      return produce(state, draft => {

        draft.elements = createElementsSnapshot(action.payload)
        draft.selectedElement = null
        // Reset history when loading new elements
        draft.history = [createElementsSnapshot(action.payload)]
        draft.historyIndex = 0

      })
    },
    
    // Layer operations
    moveElementToFront: (state, action: PayloadAction<string>) => {
      return produce(state, draft => {
        const elementId = action.payload
        const elementIndex = findElementIndex(draft.elements, elementId)
        
        if (elementIndex !== -1) {
          const element = draft.elements.splice(elementIndex, 1)[0]
          if (element) {
            draft.elements.push(element)
          }
          
          const historyResult = manageHistory(
            draft.history,
            draft.historyIndex,
            draft.elements,
            draft.maxHistorySize
          )
          draft.history = historyResult.history
          draft.historyIndex = historyResult.historyIndex
        }
      })
    },
    
    moveElementToBack: (state, action: PayloadAction<string>) => {
      return produce(state, draft => {
        const elementId = action.payload
        const elementIndex = findElementIndex(draft.elements, elementId)
        
        if (elementIndex !== -1) {
          const element = draft.elements.splice(elementIndex, 1)[0]
          if (element) {
            draft.elements.unshift(element)
          }
          
          const historyResult = manageHistory(
            draft.history,
            draft.historyIndex,
            draft.elements,
            draft.maxHistorySize
          )
          draft.history = historyResult.history
          draft.historyIndex = historyResult.historyIndex
        }
      })
    },

    moveElementForward: (state, action: PayloadAction<string>) => {
      return produce(state, draft => {
        const elementId = action.payload
        const elementIndex = findElementIndex(draft.elements, elementId)
        
        if (elementIndex !== -1 && elementIndex < draft.elements.length - 1) {
          const element = draft.elements[elementIndex]
          const nextElement = draft.elements[elementIndex + 1]
          if (element && nextElement) {
            draft.elements[elementIndex] = nextElement
            draft.elements[elementIndex + 1] = element
          }
          
          const historyResult = manageHistory(
            draft.history,
            draft.historyIndex,
            draft.elements,
            draft.maxHistorySize
          )
          draft.history = historyResult.history
          draft.historyIndex = historyResult.historyIndex
        }
      })
    },

    moveElementBackward: (state, action: PayloadAction<string>) => {
      return produce(state, draft => {
        const elementId = action.payload
        const elementIndex = findElementIndex(draft.elements, elementId)
        
        if (elementIndex !== -1 && elementIndex > 0) {
          const element = draft.elements[elementIndex]
          const prevElement = draft.elements[elementIndex - 1]
          if (element && prevElement) {
            draft.elements[elementIndex] = prevElement
            draft.elements[elementIndex - 1] = element
          }
          
          const historyResult = manageHistory(
            draft.history,
            draft.historyIndex,
            draft.elements,
            draft.maxHistorySize
          )
          draft.history = historyResult.history
          draft.historyIndex = historyResult.historyIndex
        }
      })
    },

    // Transform operations
    rotateElement: (state, action: PayloadAction<{ id: string; rotation: number }>) => {
      return produce(state, draft => {
        const { id, rotation } = action.payload
        const elementIndex = findElementIndex(draft.elements, id)
        
        if (elementIndex !== -1) {
          const element = draft.elements[elementIndex]
          if (element) {
            element.rotation = rotation
            element.version = (element.version || 1) + 1
            element.lastModified = new Date().toISOString()
          }
          
          const historyResult = manageHistory(
            draft.history,
            draft.historyIndex,
            draft.elements,
            draft.maxHistorySize
          )
          draft.history = historyResult.history
          draft.historyIndex = historyResult.historyIndex
        }
      })
    },
    
    scaleElement: (state, action: PayloadAction<{ id: string; scaleX: number; scaleY: number }>) => {
      return produce(state, draft => {
        const { id, scaleX, scaleY } = action.payload
        const elementIndex = findElementIndex(draft.elements, id)
        
        if (elementIndex !== -1) {
          const element = draft.elements[elementIndex]
          if (element) {
            element.scaleX = scaleX
            element.scaleY = scaleY
            element.version = (element.version || 1) + 1
            element.lastModified = new Date().toISOString()
          }
          
          const historyResult = manageHistory(
            draft.history,
            draft.historyIndex,
            draft.elements,
            draft.maxHistorySize
          )
          draft.history = historyResult.history
          draft.historyIndex = historyResult.historyIndex
        }
      })
    },

    // Enhanced element creation with default styles
    addTextElement: (state, action: PayloadAction<{ x: number; y: number; text?: string; id?: string }>) => {
      return produce(state, draft => {
        const { x, y, text = 'New Text', id } = action.payload
        
        const newElement = createElementWithDefaults(
          {
            id,
            type: 'text',
            x,
            y,
            text,
            width: 200,
            height: 40,
            fontSize: 16,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            fill: '#000000'
          },
          {},
          draft.elements
        )
        
        draft.elements.push(newElement)
        
        const historyResult = manageHistory(
          draft.history,
          draft.historyIndex,
          draft.elements,
          draft.maxHistorySize
        )
        draft.history = historyResult.history
        draft.historyIndex = historyResult.historyIndex
      })
    },

    addImageElement: (state, action: PayloadAction<{ x: number; y: number; src: string; id?: string }>) => {
      return produce(state, draft => {
        const { x, y, src, id } = action.payload
        
        const newElement = createElementWithDefaults(
          {
            id,
            type: 'image',
            x,
            y,
            src,
            width: 200,
            height: 150,
            borderRadius: 0,
            fitMode: 'cover'
          },
          {},
          draft.elements
        )
        
        draft.elements.push(newElement)
        
        const historyResult = manageHistory(
          draft.history,
          draft.historyIndex,
          draft.elements,
          draft.maxHistorySize
        )
        draft.history = historyResult.history
        draft.historyIndex = historyResult.historyIndex
      })
    },

    addRectElement: (state, action: PayloadAction<{ x: number; y: number; id?: string }>) => {
      return produce(state, draft => {
        const { x, y, id } = action.payload

        const newElement = createElementWithDefaults(
          {
            id,
            type: 'rect',
            x,
            y,
            width: 100,
            height: 100,
            fill: '#3b82f6',
            stroke: '#1d4ed8',
            strokeWidth: 2,
            borderRadius: 0
          },
          {},
          draft.elements
        )

        draft.elements.push(newElement)

        const historyResult = manageHistory(
          draft.history,
          draft.historyIndex,
          draft.elements,
          draft.maxHistorySize
        )
        draft.history = historyResult.history
        draft.historyIndex = historyResult.historyIndex
      })
    },

    addCircleElement: (state, action: PayloadAction<{ x: number; y: number; id?: string }>) => {
      return produce(state, draft => {
        const { x, y, id } = action.payload

        const newElement = createElementWithDefaults(
          {
            id,
            type: 'circle',
            x,
            y,
            radius: 50,
            fill: '#3b82f6',
            stroke: '#1d4ed8',
            strokeWidth: 2
          },
          {},
          draft.elements
        )

        draft.elements.push(newElement)

        const historyResult = manageHistory(
          draft.history,
          draft.historyIndex,
          draft.elements,
          draft.maxHistorySize
        )
        draft.history = historyResult.history
        draft.historyIndex = historyResult.historyIndex
      })
    },

    // Drawing tool actions
    setDrawingTool: (state, action: PayloadAction<DrawingTool>) => {
      return produce(state, draft => {
        draft.drawing.tool = action.payload
        draft.drawing.isDrawing = false
        draft.drawing.currentPath = null
        // Clear selection when switching to drawing tools
        if (action.payload !== 'none') {
          draft.selectedElement = null
        }
      })
    },

    setDrawingColor: (state, action: PayloadAction<string>) => {
      return produce(state, draft => {
        draft.drawing.color = action.payload
      })
    },

    setDrawingStrokeWidth: (state, action: PayloadAction<number>) => {
      return produce(state, draft => {
        draft.drawing.strokeWidth = action.payload
      })
    },

    startDrawing: (state, action: PayloadAction<{ x: number; y: number }>) => {
      return produce(state, draft => {
        if (draft.drawing.tool !== 'none') {
          draft.drawing.isDrawing = true
          draft.drawing.currentPath = `M${action.payload.x},${action.payload.y}`
        }
      })
    },

    updateDrawing: (state, action: PayloadAction<{ x: number; y: number }>) => {
      return produce(state, draft => {
        if (draft.drawing.isDrawing && draft.drawing.currentPath) {
          draft.drawing.currentPath += ` L${action.payload.x},${action.payload.y}`
        }
      })
    },

    finishDrawing: (state, action: PayloadAction<{ elementId?: string }>) => {
      return produce(state, draft => {
        if (draft.drawing.isDrawing && draft.drawing.currentPath && draft.drawing.tool !== 'none') {
          // Create drawing element
          const elementId = action.payload.elementId || generateElementId()
          const newElement = createElementWithDefaults(
            {
              id: elementId,
              type: 'drawing',
              x: 0,
              y: 0,
              pathData: draft.drawing.currentPath,
              tool: draft.drawing.tool,
              stroke: draft.drawing.color,
              strokeWidth: draft.drawing.strokeWidth,
              fill: 'transparent'
            },
            {},
            draft.elements
          )

              draft.elements.push(newElement)

          const historyResult = manageHistory(
            draft.history,
            draft.historyIndex,
            draft.elements,
            draft.maxHistorySize
          )
          draft.history = historyResult.history
          draft.historyIndex = historyResult.historyIndex
        }

        // Reset drawing state
        draft.drawing.isDrawing = false
        draft.drawing.currentPath = null
      })
    },

    cancelDrawing: (state) => {
      return produce(state, draft => {
        draft.drawing.isDrawing = false
        draft.drawing.currentPath = null
      })
    },

    // Transformation actions
    transformElement: (state, action: PayloadAction<{
      id: string
      transform: {
        x?: number
        y?: number
        width?: number
        height?: number
        rotation?: number
        scaleX?: number
        scaleY?: number
      }
    }>) => {
      return produce(state, draft => {
        const element = draft.elements.find(el => el.id === action.payload.id)
        if (element) {
          const { transform } = action.payload
          if (transform.x !== undefined) element.x = transform.x
          if (transform.y !== undefined) element.y = transform.y
          if (transform.width !== undefined) element.width = transform.width
          if (transform.height !== undefined) element.height = transform.height
          if (transform.rotation !== undefined) element.rotation = transform.rotation
          if (transform.scaleX !== undefined) element.scaleX = transform.scaleX
          if (transform.scaleY !== undefined) element.scaleY = transform.scaleY
          
          element.lastModified = new Date().toISOString()
          element.version = (element.version || 1) + 1
        }
      })
    },

    // Layer order actions
    bringToFront: (state, action: PayloadAction<string>) => {
      return produce(state, draft => {
        const element = draft.elements.find(el => el.id === action.payload)
        if (element) {
          const maxZIndex = Math.max(...draft.elements.map(el => el.zIndex || 0))
          element.zIndex = maxZIndex + 1
          element.lastModified = new Date().toISOString()
          element.version = (element.version || 1) + 1
        }
      })
    },

    sendToBack: (state, action: PayloadAction<string>) => {
      return produce(state, draft => {
        const element = draft.elements.find(el => el.id === action.payload)
        if (element) {
          const minZIndex = Math.min(...draft.elements.map(el => el.zIndex || 0))
          element.zIndex = minZIndex - 1
          element.lastModified = new Date().toISOString()
          element.version = (element.version || 1) + 1
        }
      })
    },

    bringForward: (state, action: PayloadAction<string>) => {
      return produce(state, draft => {
        const element = draft.elements.find(el => el.id === action.payload)
        if (element) {
          const currentZIndex = element.zIndex || 0
          const nextElement = draft.elements
            .filter(el => (el.zIndex || 0) > currentZIndex)
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))[0]
          
          if (nextElement) {
            element.zIndex = (nextElement.zIndex || 0) + 1
            element.lastModified = new Date().toISOString()
            element.version = (element.version || 1) + 1
          }
        }
      })
    },

    sendBackward: (state, action: PayloadAction<string>) => {
      return produce(state, draft => {
        const element = draft.elements.find(el => el.id === action.payload)
        if (element) {
          const currentZIndex = element.zIndex || 0
          const prevElement = draft.elements
            .filter(el => (el.zIndex || 0) < currentZIndex)
            .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))[0]
          
          if (prevElement) {
            element.zIndex = (prevElement.zIndex || 0) - 1
            element.lastModified = new Date().toISOString()
            element.version = (element.version || 1) + 1
          }
        }
      })
    }
  }
})

export const {
  addElement,
  updateElement,
  removeElement,
  duplicateElement,
  selectElement,
  clearSelection,
  setCanvasSize,
  setZoom,
  setPan,
  resetView,
  undo,
  redo,
  clearHistory,
  setMaxHistorySize,
  clearCanvas,
  loadElements,
  moveElementToFront,
  moveElementToBack,
  moveElementForward,
  moveElementBackward,
  rotateElement,
  scaleElement,
  addTextElement,
  addImageElement,
  addRectElement,
  addCircleElement,
  setDrawingTool,
  setDrawingColor,
  setDrawingStrokeWidth,
  startDrawing,
  updateDrawing,
  finishDrawing,
  cancelDrawing,
  transformElement,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward
} = canvasSlice.actions

// Selectors
export const selectCanUndo = (state: { canvas: CanvasState }) => state.canvas.historyIndex > 0
export const selectCanRedo = (state: { canvas: CanvasState }) => state.canvas.historyIndex < state.canvas.history.length - 1
export const selectDrawingState = (state: { canvas: CanvasState }) => state.canvas.drawing
export const selectDrawingTool = (state: { canvas: CanvasState }) => state.canvas.drawing.tool
export const selectDrawingColor = (state: { canvas: CanvasState }) => state.canvas.drawing.color
export const selectDrawingStrokeWidth = (state: { canvas: CanvasState }) => state.canvas.drawing.strokeWidth
export const selectIsDrawing = (state: { canvas: CanvasState }) => state.canvas.drawing.isDrawing
export const selectHistoryInfo = (state: { canvas: CanvasState }) => ({
  canUndo: state.canvas.historyIndex > 0,
  canRedo: state.canvas.historyIndex < state.canvas.history.length - 1,
  historyLength: state.canvas.history.length,
  currentIndex: state.canvas.historyIndex,
  maxSize: state.canvas.maxHistorySize
})
export const selectSelectedElementId = (state: { canvas: CanvasState }) => state.canvas.selectedElement
export const selectElements = (state: { canvas: CanvasState }) => state.canvas.elements

export default canvasSlice.reducer