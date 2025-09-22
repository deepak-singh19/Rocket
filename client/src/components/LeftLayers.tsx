import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { 
  selectElement, 
  clearSelection, 
  moveElementToFront, 
  moveElementToBack, 
  moveElementForward,
  moveElementBackward,
  removeElement,
  updateElement,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward
} from '../store/canvasSlice'
import { CollaborationHookReturn } from '../hooks/useCollaboration'

interface LeftLayersProps {
  collaboration?: CollaborationHookReturn
}

const LeftLayers: React.FC<LeftLayersProps> = ({ collaboration }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { elements, selectedElement } = useSelector((state: RootState) => state.canvas)
  const { selectedDesign } = useSelector((state: RootState) => state.designs)
  
  const [editingElement, setEditingElement] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleElementSelect = (elementId: string) => {
    dispatch(selectElement(elementId))
  }

  const handleElementDelete = (elementId: string) => {
    // Remove element locally
    dispatch(removeElement(elementId))
    
    // Broadcast deletion to other users
    if (selectedDesign && collaboration) {

      collaboration.broadcastElementOperation({
        type: 'element_deleted',
        designId: selectedDesign._id,
        elementId: elementId
      })
    } else {

    }
  }

  const handleMoveToFront = (elementId: string) => {
    dispatch(bringToFront(elementId))
  }

  const handleMoveToBack = (elementId: string) => {
    dispatch(sendToBack(elementId))
  }

  const handleMoveForward = (elementId: string) => {
    dispatch(bringForward(elementId))
  }

  const handleMoveBackward = (elementId: string) => {
    dispatch(sendBackward(elementId))
  }

  const handleStartRename = (elementId: string, currentName: string) => {
    setEditingElement(elementId)
    setEditName(currentName)
  }

  const handleFinishRename = () => {
    if (editingElement && editName.trim()) {
      dispatch(updateElement({ 
        id: editingElement, 
        updates: { 
          data: { 
            ...elements.find(el => el.id === editingElement)?.data,
            customName: editName.trim() 
          } 
        } 
      }))
    }
    setEditingElement(null)
    setEditName('')
  }

  const handleCancelRename = () => {
    setEditingElement(null)
    setEditName('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishRename()
    } else if (e.key === 'Escape') {
      handleCancelRename()
    }
  }

  const getElementIcon = (type: string) => {
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
      case 'drawing':
        return '✏️'
      default:
        return '🔷'
    }
  }

  const getElementName = (element: any) => {
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
      case 'drawing':
        const toolName = element.tool || 'drawing'
        return `${toolName.charAt(0).toUpperCase() + toolName.slice(1)} ${element.id.slice(-4)}`
      default:
        return `${element.type} ${element.id.slice(-4)}`
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Layers</h2>
        <p className="text-sm text-gray-500 mt-1">
          {elements.length} element{elements.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        {elements.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-4xl mb-2">🎨</div>
            <p className="text-sm">No elements yet</p>
            <p className="text-xs mt-1">Add elements to see them here</p>
          </div>
        ) : (
          <div className="p-2">
            {/* Render elements in reverse order (top elements first) */}
            {[...elements].reverse().map((element, index) => {
              const actualIndex = elements.length - 1 - index
              const isSelected = selectedElement === element.id
              const isEditing = editingElement === element.id
              const elementName = getElementName(element)
              
              return (
                <div
                  key={element.id}
                  className={`group relative p-3 mb-1 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-primary-50 border-primary-200' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => !isEditing && handleElementSelect(element.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-lg">{getElementIcon(element.type)}</div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={handleFinishRename}
                          onKeyDown={handleKeyPress}
                          className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none"
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {elementName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {element.type} • {Math.round(element.x)}, {Math.round(element.y)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Element actions */}
                  {!isEditing && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-1">
                        {/* Z-index controls */}
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMoveForward(element.id)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Bring forward"
                            disabled={actualIndex === elements.length - 1}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMoveBackward(element.id)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Send backward"
                            disabled={actualIndex === 0}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Quick actions */}
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartRename(element.id, elementName)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Rename"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleElementDelete(element.id)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete element"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => dispatch(clearSelection())}
          className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Clear Selection
        </button>
        
        {/* Layer order info */}
        {elements.length > 0 && (
          <div className="text-xs text-gray-500 text-center">
            Top to bottom: Front to back
          </div>
        )}
      </div>
    </div>
  )
}

export default LeftLayers
