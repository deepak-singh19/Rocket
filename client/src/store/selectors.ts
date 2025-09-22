import { createSelector } from '@reduxjs/toolkit'
import { RootState } from './index'
import { CanvasElement } from '../types'

// Base selectors
export const selectCanvasState = (state: RootState) => state.canvas
export const selectElements = (state: RootState) => state.canvas.elements
export const selectSelectedElement = (state: RootState) => state.canvas.selectedElement
export const selectCanvasSize = (state: RootState) => state.canvas.canvasSize
export const selectZoom = (state: RootState) => state.canvas.zoom
export const selectPan = (state: RootState) => state.canvas.pan
export const selectHistory = (state: RootState) => state.canvas.history
export const selectHistoryIndex = (state: RootState) => state.canvas.historyIndex

// Memoized selectors for CanvasStage
export const selectCanvasStageData = createSelector(
  [selectElements, selectSelectedElement, selectCanvasSize, selectZoom, selectPan],
  (elements, selectedElement, canvasSize, zoom, pan) => ({
    elements,
    selectedElement,
    canvasSize,
    zoom,
    pan
  })
)

// Memoized selector for selected element details
export const selectSelectedElementDetails = createSelector(
  [selectElements, selectSelectedElement],
  (elements, selectedElementId) => {
    if (!selectedElementId) return null
    return elements.find(el => el.id === selectedElementId) || null
  }
)

// Memoized selector for elements count
export const selectElementsCount = createSelector(
  [selectElements],
  (elements) => elements.length
)

// Memoized selector for elements by type
export const selectElementsByType = createSelector(
  [selectElements],
  (elements) => {
    return elements.reduce((acc, element) => {
      if (!acc[element.type]) {
        acc[element.type] = []
      }
      acc[element.type].push(element)
      return acc
    }, {} as Record<string, CanvasElement[]>)
  }
)

// Memoized selector for LeftLayers
export const selectLayersData = createSelector(
  [selectElements, selectSelectedElement],
  (elements, selectedElement) => {
    // Create a memoized version of elements with computed properties
    const elementsWithMetadata = elements.map(element => ({
      ...element,
      displayName: getElementDisplayName(element),
      icon: getElementIcon(element.type),
      isSelected: element.id === selectedElement
    }))
    
    return {
      elements: elementsWithMetadata,
      selectedElement,
      count: elements.length
    }
  }
)

// Memoized selector for reversed elements (for layers display)
export const selectReversedElements = createSelector(
  [selectLayersData],
  (layersData) => ({
    ...layersData,
    elements: [...layersData.elements].reverse()
  })
)

// Helper functions for element metadata
const getElementDisplayName = (element: CanvasElement): string => {
  // Check if element has a custom name
  if (element.data?.customName) {
    return element.data.customName
  }

  // Generate default name based on type and content
  switch (element.type) {
    case 'rect':
      return `Rectangle ${element.id.slice(-4)}`
    case 'circle':
      return `Circle ${element.id.slice(-4)}`
    case 'text':
      return element.text ? element.text.substring(0, 20) + (element.text.length > 20 ? '...' : '') : `Text ${element.id.slice(-4)}`
    case 'image':
      return `Image ${element.id.slice(-4)}`
    case 'line':
      return `Line ${element.id.slice(-4)}`
    default:
      return `${element.type} ${element.id.slice(-4)}`
  }
}

const getElementIcon = (type: string): string => {
  switch (type) {
    case 'rect':
      return '⬜'
    case 'circle':
      return '⭕'
    case 'text':
      return '📝'
    case 'image':
      return '🖼️'
    case 'line':
      return '📏'
    default:
      return '🔷'
  }
}

// Memoized selector for collaboration data
export const selectCollaborationData = createSelector(
  [(state: RootState) => state.collaboration],
  (collaboration) => ({
    isConnected: collaboration.isConnected,
    currentUser: collaboration.currentUser,
    roomUsers: collaboration.roomUsers,
    ghostElements: collaboration.ghostElements,
    userCursors: collaboration.userCursors
  })
)

// Memoized selector for design data
export const selectDesignData = createSelector(
  [(state: RootState) => state.designs],
  (designs) => ({
    selectedDesign: designs.selectedDesign,
    loading: designs.loading,
    error: designs.error
  })
)
