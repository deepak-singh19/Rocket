import React, { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { fetchDesigns, switchToDesign, clearSelectedDesign, fetchDesignById } from '../store/designsSlice'
import { 
  loadElements, 
  setCanvasSize, 
  clearCanvas,
  undo, 
  redo, 
  removeElement,
  addElement,
  updateElement,
  selectCanUndo, 
  selectCanRedo,
  selectSelectedElementId,
  selectElements,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward
} from '../store/canvasSlice'
import { useCollaboration } from '../hooks/useCollaboration'
import TopBar from '../components/TopBar'
import LeftLayers from '../components/LeftLayers'
import RightProperties from '../components/RightProperties'
import CanvasStage from '../components/CanvasStage'
import ErrorBoundary from '../components/ErrorBoundary'

const DesignEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const { designs, selectedDesign, loading, error } = useSelector((state: RootState) => state.designs)
  
  // Canvas state
  const canvasState = useSelector((state: RootState) => state.canvas)
  const elements = canvasState?.elements || []
  const canUndo = useSelector(selectCanUndo)
  const canRedo = useSelector(selectCanRedo)
  const selectedElementId = useSelector(selectSelectedElementId)
  
  // Initialize collaboration
  const collaboration = useCollaboration(selectedDesign?._id || null, 'User')
  
  // Clipboard for copy/paste
  const clipboardRef = useRef<any>(null)

  // Helper function to notify collaborators
  const notifyCollaborators = () => {
    if (collaboration?.isConnected && typeof collaboration.broadcastRefreshSignal === 'function') {
      collaboration.broadcastRefreshSignal()
    }
  }

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field
      const target = event.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'
      
      if (isInputField) return

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey

      // Undo: Ctrl/Cmd + Z
      if (ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        if (canUndo) {
          dispatch(undo())
          notifyCollaborators()
        }
        return
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (ctrlKey && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault()
        if (canRedo) {
          dispatch(redo())
          notifyCollaborators()
        }
        return
      }

      // Copy: Ctrl/Cmd + C
      if (ctrlKey && event.key === 'c') {
        event.preventDefault()
        if (selectedElementId) {
          const element = elements.find(el => el.id === selectedElementId)
          if (element) {
            const copiedElement = {
              ...element,
              id: `${element.type}_${Date.now()}`,
              x: element.x + 10,
              y: element.y + 10
            }
            clipboardRef.current = copiedElement
          }
        }
        return
      }

      // Paste: Ctrl/Cmd + V
      if (ctrlKey && event.key === 'v') {
        event.preventDefault()
        if (clipboardRef.current) {
          const elementToPaste = {
            ...clipboardRef.current,
            id: `${clipboardRef.current.type}_${Date.now()}`,
            x: clipboardRef.current.x + 10,
            y: clipboardRef.current.y + 10
          }
          
          dispatch(addElement(elementToPaste))
          notifyCollaborators()
        }
        return
      }

      // Delete: Delete key or Backspace
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        if (selectedElementId) {
          dispatch(removeElement(selectedElementId))
          notifyCollaborators()
        }
        return
      }

      // Arrow key nudging
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
        if (selectedElementId) {
          const element = elements.find(el => el.id === selectedElementId)
          if (element) {
            const distance = event.shiftKey ? 10 : 1
            let newX = element.x
            let newY = element.y
            
            switch (event.key) {
              case 'ArrowUp':
                newY -= distance
                break
              case 'ArrowDown':
                newY += distance
                break
              case 'ArrowLeft':
                newX -= distance
                break
              case 'ArrowRight':
                newX += distance
                break
            }
            
            dispatch(updateElement({ id: selectedElementId, updates: { x: newX, y: newY } }))
            notifyCollaborators()
          }
        }
        return
      }

      // Layer order shortcuts
      if (selectedElementId && ctrlKey) {
        switch (event.key) {
          case ']':
            event.preventDefault()
            dispatch(bringForward(selectedElementId))
            notifyCollaborators()
            return
          case '[':
            event.preventDefault()
            dispatch(sendBackward(selectedElementId))
            notifyCollaborators()
            return
          case '}':
            event.preventDefault()
            dispatch(bringToFront(selectedElementId))
            notifyCollaborators()
            return
          case '{':
            event.preventDefault()
            dispatch(sendToBack(selectedElementId))
            notifyCollaborators()
            return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    dispatch, 
    canUndo, 
    canRedo, 
    selectedElementId, 
    elements, 
    collaboration
  ])

  // Global cache approach: Load all designs once, then switch locally
  useEffect(() => {
    if (designs.length === 0 && !loading) {
      dispatch(fetchDesigns({}))
    }
  }, [designs.length, loading, dispatch])

  // Switch to specific design when id changes
  useEffect(() => {
    if (id && designs.length > 0) {
      dispatch(switchToDesign(id))
    }
  }, [id, designs.length, dispatch])

  // Load elements when design changes
  useEffect(() => {
    if (selectedDesign && id) {
      // Set canvas size
      dispatch(setCanvasSize({ 
        width: selectedDesign.width, 
        height: selectedDesign.height 
      }))
      
      // Load elements from cached design
      if (selectedDesign.elements?.objects) {
        dispatch(loadElements(selectedDesign.elements.objects))
      } else {
        dispatch(loadElements([]))
      }
    }
  }, [selectedDesign?._id, id, dispatch])

  // Cleanup effect
  useEffect(() => {
    return () => {
      dispatch(clearCanvas())
    }
  }, [dispatch])

  // Loading state
  if (loading || (designs.length === 0 && !selectedDesign)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 mt-4">
              {designs.length === 0 ? 'Loading designs...' : 'Loading design...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error states
  if (id && designs.length > 0 && !selectedDesign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Design Not Found</h2>
            <p className="text-gray-600">The design with ID "{id}" was not found in the cache.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium">Design not found</div>
            <div className="text-gray-600 mt-2">{error}</div>
            {id && (
              <button 
                onClick={() => dispatch(fetchDesignById(id))}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const handleRefreshDesign = () => {
    dispatch(clearSelectedDesign())
    dispatch(fetchDesignById(id!))
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopBar collaboration={collaboration} />
        
        {/* Debug Panel */}
        {/* <div className="bg-yellow-100 border-b border-yellow-300 p-2 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <strong>Debug:</strong> Elements: {elements.length} | 
              Server Elements: {selectedDesign?.elements?.objects?.length || 0} | 
              Design ID: {selectedDesign?._id} |
              Collab Connected: {collaboration?.isConnected ? 'Yes' : 'No'} |
              Selected: {selectedElementId || 'None'}
            </div>
            <button 
              onClick={handleRefreshDesign}
              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
            >
              Refresh Design
            </button>
          </div>
        </div> */}
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Layers */}
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <LeftLayers collaboration={collaboration} />
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex">
              {/* Canvas Stage */}
              <div className="flex-1 bg-gray-100 p-4">
                <CanvasStage collaboration={collaboration} />
              </div>

              {/* Right Sidebar - Properties */}
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                <RightProperties />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default DesignEditor
