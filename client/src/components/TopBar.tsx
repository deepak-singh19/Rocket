import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { undo, redo, clearCanvas, addTextElement, addImageElement, addRectElement, addCircleElement, setDrawingTool, setDrawingColor, setDrawingStrokeWidth, selectDrawingTool, selectDrawingColor, selectDrawingStrokeWidth, bringForward, sendBackward, selectCanUndo, selectCanRedo, selectSelectedElementId } from '../store/canvasSlice'
import { saveDesign } from '../store/designsSlice'
import { logout } from '../store/authSlice'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp'
import { useDownloadCanvas } from '../hooks/useDownloadCanvas'
import { useAutosave } from '../hooks/useAutosave'
import { useToast } from '../hooks/useToast'
import { useAutosaveSettings } from '../hooks/useAutosaveSettings'
import { useComments } from '../hooks/useComments'
import AutosaveIndicator from './AutosaveIndicator'
import AutosaveSettings from './AutosaveSettings'
import DownloadPreviewModal from './DownloadPreviewModal'
import ToastContainer from './ToastContainer'
import CommentsPanel from './CommentsPanel'
import ColorPicker from './ColorPicker'
import PresenceIndicator from './PresenceIndicator'
import { generateElementId } from '../utils/uuid'
// import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts' // Temporarily disabled

interface TopBarProps {
  collaboration?: {
    isConnected: boolean
    users: Array<{ id: string; name: string; cursor?: { x: number; y: number } }>
    currentUser: { id: string; name: string } | null
    broadcastRefreshSignal?: () => void
    broadcastElementOperation?: (operation: any) => void
  }
}

const TopBar: React.FC<TopBarProps> = ({ collaboration }) => {
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()
  const { selectedDesign } = useSelector((state: RootState) => state.designs)
  const { elements, canvasSize } = useSelector((state: RootState) => state.canvas)
  const { user } = useSelector((state: RootState) => state.auth)
  const drawingTool = useSelector(selectDrawingTool)
  const drawingColor = useSelector(selectDrawingColor)
  const drawingStrokeWidth = useSelector(selectDrawingStrokeWidth)
  const canUndo = useSelector(selectCanUndo)
  const canRedo = useSelector(selectCanRedo)
  const selectedElementId = useSelector(selectSelectedElementId)
  
  
  // Use keyboard shortcuts hook - temporarily disabled for commenting system demo
  // const { 
  //   canUndo, 
  //   canRedo, 
  //   selectedElementId,
  //   clipboardHasContent,
  //   copyElement,
  //   pasteElement,
  //   deleteElement,
  //   nudgeElement
  // } = useKeyboardShortcuts({ collaboration })

  // Handle help shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      
      const target = event.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'
      
      if (isInputField) return

     
      if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        setShowKeyboardShortcuts(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  
  const { downloadCanvas } = useDownloadCanvas()
  
  // Use toast hook
  const { toasts, removeToast, showSuccess, showError } = useToast()
  
 
  const isEditor = location.pathname.includes('/design/') && location.pathname !== '/design/new'
  
 
  const { 
    settings: autosaveSettings, 
    updateSettings: setAutosaveSettings,
    isLoaded: settingsLoaded 
  } = useAutosaveSettings()
  
  
  const { 
    forceSave,
    isSaving, 
    savingProgress,
    lastSaved,
    saveError,
    pendingChanges,
    saveCount
  } = useAutosave({
    enabled: true,
    debounceMs: settingsLoaded ? autosaveSettings.debounceMs : 500,
    batchChanges: settingsLoaded ? autosaveSettings.batchChanges : true,
    maxBatchSize: settingsLoaded ? autosaveSettings.maxBatchSize : 10,
    showProgress: settingsLoaded ? autosaveSettings.showProgress : true,
    generateThumbnail: false, 
    thumbnailOptions: {
      width: 300,
      height: 200,
      pixelRatio: 0.5, 
      quality: 0.8
    },
    collaboration: collaboration && collaboration.isConnected && collaboration.broadcastRefreshSignal ? {
      isConnected: collaboration.isConnected,
      broadcastRefreshSignal: collaboration.broadcastRefreshSignal
    } : undefined,
    onSave: async (data) => {
      if (!selectedDesign) throw new Error('No design selected')
      await dispatch(saveDesign({ id: selectedDesign._id, data })).unwrap()
    }
  })

  
  const { 
    isConnected = false, 
    users: roomUsers = [],
    broadcastElementOperation = () => {}
  } = collaboration || {}
  
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showAutosaveSettings, setShowAutosaveSettings] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

 
  const { comments: realComments } = useComments({ 
    designId: selectedDesign?._id || '',
    collaboration 
  })

  // Calculate unresolved comments count for notification using real comments
  const unresolvedCommentsCount = selectedDesign?._id ? realComments.filter(comment => !comment.isResolved).length : 0
  const hasUnresolvedComments = unresolvedCommentsCount > 0

  const handleSave = async () => {
    if (!selectedDesign) return

    try {
      const saveData = {
        elements: {
          canvas: {
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundColor: '#ffffff'
          },
          objects: elements
        }
      }

      await dispatch(saveDesign({ id: selectedDesign._id, data: saveData })).unwrap()
      showSuccess('Design saved successfully', { timestamp: new Date() })
    } catch (error: any) {
      console.error('Failed to save design:', error)
      showError('Failed to save design', { timestamp: new Date() })
    }
  }

  const handleAddText = () => {
    const elementId = generateElementId()
    const elementData = { 
      x: canvasSize.width / 2 - 100, 
      y: canvasSize.height / 2 - 20 
    }
    dispatch(addTextElement({ ...elementData, id: elementId }))
    
   
    if (selectedDesign && isConnected) {
      broadcastElementOperation({
        type: 'element_added',
        designId: selectedDesign._id,
        elementId: elementId,
        element: {
          id: elementId,
          type: 'text',
          ...elementData,
          width: 200,
          height: 40,
          text: 'New Text',
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'normal',
          fill: '#000000',
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0,
          scaleX: 1,
          scaleY: 1
        }
      })
    }
  }

  const handleAddImage = () => {
    setShowImageModal(true)
  }

  const handleAddRect = () => {
    const elementId = generateElementId()
    const elementData = { 
      x: canvasSize.width / 2 - 50, 
      y: canvasSize.height / 2 - 50 
    }
    dispatch(addRectElement({ ...elementData, id: elementId }))
    
    
    if (selectedDesign && isConnected) {
      broadcastElementOperation({
        type: 'element_added',
        designId: selectedDesign._id,
        elementId: elementId,
        element: {
          id: elementId,
          type: 'rect',
          ...elementData,
          width: 100,
          height: 100,
          fill: '#3B82F6',
          stroke: '#1E40AF',
          strokeWidth: 2,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0,
          scaleX: 1,
          scaleY: 1
        }
      })
    }
  }

  const handleAddCircle = () => {
    const elementId = generateElementId()
    const elementData = { 
      x: canvasSize.width / 2 - 50, 
      y: canvasSize.height / 2 - 50 
    }
    dispatch(addCircleElement({ ...elementData, id: elementId }))
    
   
    if (selectedDesign && isConnected) {
      broadcastElementOperation({
        type: 'element_added',
        designId: selectedDesign._id,
        elementId: elementId,
        element: {
          id: elementId,
          type: 'circle',
          ...elementData,
          radius: 50,
          fill: '#10B981',
          stroke: '#059669',
          strokeWidth: 2,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0,
          scaleX: 1,
          scaleY: 1
        }
      })
    }
  }

  const handleImageSubmit = () => {
    if (imageUrl.trim()) {
      const elementId = generateElementId()
      const elementData = { 
        x: canvasSize.width / 2 - 100, 
        y: canvasSize.height / 2 - 75,
        src: imageUrl.trim()
      }
      dispatch(addImageElement({ ...elementData, id: elementId }))
      
    
      if (selectedDesign && isConnected) {
        broadcastElementOperation({
          type: 'element_added',
          designId: selectedDesign._id,
          elementId: elementId,
          element: {
            id: elementId,
            type: 'image',
            ...elementData,
            width: 200,
            height: 150,
            opacity: 1,
            visible: true,
            locked: false,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
          }
        })
      }
      
      setImageUrl('')
      setShowImageModal(false)
    }
  }

  const handleDownload = () => {
    setShowDownloadModal(true)
  }


  return (
    <header className="bg-white border-b border-gray-200 px-2 md:px-4 py-2 overflow-hidden">
      {/* First Line - Logo, Navigation, and User Actions */}
      <div className="flex items-center justify-between min-w-0 max-w-full mb-2">
        {/* Left side - Logo and Navigation */}
        <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-shrink-0">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <span className="font-bold text-gray-900">Canvas Studio</span>
          </Link>

          {isEditor && (
            <nav className="flex items-center space-x-1 md:space-x-2 lg:space-x-4 overflow-x-auto">
              <button
                onClick={() => dispatch(undo())}
                disabled={!canUndo}
                className="flex items-center space-x-1 px-2 md:px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                title={`Undo (${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+Z)`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span className="hidden sm:inline">Undo</span>
              </button>
              <button
                onClick={() => dispatch(redo())}
                disabled={!canRedo}
                className="flex items-center space-x-1 px-2 md:px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                title={`Redo (${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+Y)`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
                <span className="hidden sm:inline">Redo</span>
              </button>
              
              {/* Layer Order Test Buttons */}
              <button
                onClick={() => selectedElementId && dispatch(bringForward(selectedElementId))}
                disabled={!selectedElementId}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Bring Forward (Ctrl+])"
              >
                <span>⬆️</span>
                <span>Forward</span>
              </button>
              <button
                onClick={() => selectedElementId && dispatch(sendBackward(selectedElementId))}
                disabled={!selectedElementId}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send Backward (Ctrl+[)"
              >
                <span>⬇️</span>
                <span>Backward</span>
              </button>
            </nav>
          )}
        </div>

               {/* Center - Design Name and Collaboration (in editor) */}
               {isEditor && selectedDesign && (
                 <div className="flex-1 flex flex-col items-center space-y-2">
                   <div className="text-center">
                     <h1 className="text-lg font-medium text-gray-900">{selectedDesign.name}</h1>
                     <p className="text-sm text-gray-500">{selectedDesign.width} × {selectedDesign.height}</p>
                   </div>
                   
                   {/* Autosave Indicator */}
                   <AutosaveIndicator
                     isSaving={isSaving}
                     savingProgress={savingProgress}
                     lastSaved={lastSaved}
                     saveError={saveError}
                     pendingChanges={pendingChanges}
                     saveCount={saveCount}
                     onForceSave={forceSave}
                     showDetails={false}
                   />
                   
                   {/* Collaboration Status */}
                   {collaboration && (
                     <PresenceIndicator
                       users={collaboration.users}
                       currentUser={collaboration.currentUser}
                       isConnected={collaboration.isConnected}
                     />
                   )}
                 </div>
               )}

        {/* Right side - User Actions Only */}
        <div className="flex items-center space-x-4">
          {isEditor && (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
              >
                Save Design
              </button>
            </>
          )}
          
          {!isEditor && (
            <Link
              to="/design/new"
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
            >
              New Design
            </Link>
          )}

          {/* User menu */}
          <div className="flex items-center space-x-2">
            {user && (
              <>
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm text-gray-700">
                  {user.name}
                </span>
                <button
                  onClick={() => dispatch(logout())}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
                  title="Logout"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Second Line - Add Elements (Editor Only) */}
      {isEditor && (
        <div className="flex items-center justify-center min-w-0 max-w-full mb-2">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={handleAddText}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
            >
              <span>📝</span>
              <span>Add Text</span>
            </button>
            <button
              onClick={handleAddImage}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
            >
              <span>🖼️</span>
              <span>Add Image</span>
            </button>
            <button
              onClick={handleAddRect}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
            >
              <span>⬜</span>
              <span>Rectangle</span>
            </button>
            <button
              onClick={handleAddCircle}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
            >
              <span>⭕</span>
              <span>Circle</span>
            </button>
          </div>
        </div>
      )}

      {/* Third Line - Drawing Tools (Editor Only) */}
      {isEditor && (
        <div className="flex items-center justify-center min-w-0 max-w-full mb-2">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-sm text-gray-500 font-medium">Drawing:</span>
            
            {/* Drawing Tool Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => dispatch(setDrawingTool('pencil'))}
                className={`flex items-center space-x-1 px-2 py-1 text-sm rounded ${
                  drawingTool === 'pencil'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
                }`}
                title="Pencil Tool"
              >
                <span>✏️</span>
                <span>Pencil</span>
              </button>
              
              <button
                onClick={() => dispatch(setDrawingTool('pen'))}
                className={`flex items-center space-x-1 px-2 py-1 text-sm rounded ${
                  drawingTool === 'pen'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
                }`}
                title="Pen Tool"
              >
                <span>🖊️</span>
                <span>Pen</span>
              </button>
              
              <button
                onClick={() => dispatch(setDrawingTool('none'))}
                className={`flex items-center space-x-1 px-2 py-1 text-sm rounded ${
                  drawingTool === 'none'
                    ? 'bg-gray-100 text-gray-700 border border-gray-300'
                    : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
                }`}
                title="Select Tool"
              >
                <span>👆</span>
                <span>Select</span>
              </button>
            </div>

            {/* Drawing Options */}
            {drawingTool !== 'none' && (
              <div className="flex items-center space-x-2">
                <ColorPicker
                  color={drawingColor}
                  onChange={(color) => dispatch(setDrawingColor(color))}
                  label=""
                />
                
                <div className="flex items-center space-x-1">
                  <label className="text-sm text-gray-500">Size:</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={drawingStrokeWidth}
                    onChange={(e) => dispatch(setDrawingStrokeWidth(parseInt(e.target.value)))}
                    className="w-16"
                    title={`Stroke width: ${drawingStrokeWidth}px`}
                  />
                  <span className="text-xs text-gray-500 w-6">{drawingStrokeWidth}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fourth Line - Additional Controls (Editor Only) */}
      {isEditor && (
        <div className="flex items-center justify-between min-w-0 max-w-full">
          {/* Left side - Canvas Actions */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => dispatch(clearCanvas())}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded hover:bg-red-50 whitespace-nowrap"
            >
              Clear Canvas
            </button>

            {/* Collaboration Status */}
            <div className="flex items-center space-x-2 px-3 py-1 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-gray-600 whitespace-nowrap">
                {isConnected ? `${roomUsers.length} user${roomUsers.length !== 1 ? 's' : ''} online` : 'Offline'}
              </span>
            </div>
          </div>

          {/* Center - Element Actions */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {/* Copy/Paste Buttons - Temporarily disabled for commenting system demo */}
            {/* Keyboard shortcuts are handled in DesignEditor.tsx */}
          </div>

          {/* Right side - Utility Actions */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setShowComments(true)}
              className={`relative flex items-center space-x-1 px-3 py-1 text-sm border rounded hover:bg-gray-50 whitespace-nowrap transition-all duration-200 ${
                hasUnresolvedComments
                  ? 'text-orange-600 border-orange-300 bg-orange-50 animate-pulse hover:text-orange-700 hover:border-orange-400'
                  : 'text-gray-600 hover:text-gray-900 border-gray-300'
              }`}
              title={hasUnresolvedComments ? `${unresolvedCommentsCount} unresolved comment${unresolvedCommentsCount !== 1 ? 's' : ''}` : 'Comments'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Comments</span>
              {hasUnresolvedComments && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-white">
                  {unresolvedCommentsCount > 9 ? '9+' : unresolvedCommentsCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setShowAutosaveSettings(true)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
              title="Autosave Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Autosave</span>
            </button>
            
            <button
              onClick={() => setShowKeyboardShortcuts(true)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
              title="Keyboard Shortcuts Help"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Shortcuts</span>
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
              title="Download as PNG"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download</span>
            </button>
          </div>
        </div>
      )}

      {/* Image URL Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Image</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setImageUrl('')
                    setShowImageModal(false)
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImageSubmit}
                  disabled={!imageUrl.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Preview Modal */}
      {showDownloadModal && (
        <DownloadPreviewModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          onDownload={() => {}} // Not used, handled internally in modal
          elements={elements}
          canvasSize={canvasSize}
          designName={selectedDesign?.name || 'Untitled Design'}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Comments Panel */}
      {showComments && selectedDesign && (
        <CommentsPanel
          designId={selectedDesign._id}
          selectedElementId={null} // Global comments
          onClose={() => setShowComments(false)}
        />
      )}

      {/* Autosave Settings Modal */}
      {showAutosaveSettings && (
        <AutosaveSettings
          enabled={autosaveSettings.enabled}
          debounceMs={autosaveSettings.debounceMs}
          batchChanges={autosaveSettings.batchChanges}
          maxBatchSize={autosaveSettings.maxBatchSize}
          showProgress={autosaveSettings.showProgress}
          onSettingsChange={setAutosaveSettings}
          onClose={() => setShowAutosaveSettings(false)}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsHelp
          isOpen={showKeyboardShortcuts}
          onClose={() => setShowKeyboardShortcuts(false)}
        />
      )}
    </header>
  )
}

export default TopBar
