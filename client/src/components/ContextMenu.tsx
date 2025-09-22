import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { 
  bringToFront, 
  sendToBack, 
  bringForward, 
  sendBackward,
  removeElement,
  duplicateElement
} from '../store/canvasSlice'

interface ContextMenuProps {
  x: number
  y: number
  elementId: string | null
  onClose: () => void
  collaboration?: any
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, 
  y, 
  elementId, 
  onClose, 
  collaboration 
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { selectedDesign } = useSelector((state: RootState) => state.designs)

  const handleLayerAction = (action: () => void, zIndexType?: string) => {
    action()
    
    // Broadcast z-index operation to other users
    if (elementId && zIndexType && collaboration && collaboration.isConnected && collaboration.currentUser && collaboration.broadcastElementOperation) {
      collaboration.broadcastElementOperation({
        type: 'element_moved',
        elementId,
        updates: { zIndex: zIndexType }
      })
    }
    
    onClose()
  }

  const handleDelete = () => {
    if (elementId) {
      // Remove element locally
      dispatch(removeElement(elementId))
      
      // Broadcast deletion to other users
      if (selectedDesign && collaboration && collaboration.isConnected && collaboration.currentUser) {
        collaboration.broadcastElementOperation({
          type: 'element_deleted',
          elementId: elementId
        })
      }
    }
    onClose()
  }

  const handleDuplicate = () => {
    if (elementId) {
      dispatch(duplicateElement(elementId))
    }
    onClose()
  }

  if (!elementId) return null

  return (
    <div 
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-48"
      style={{ left: x, top: y }}
    >
      {/* Layer Order Section */}
      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Layer Order
      </div>
      
      <button
        onClick={() => handleLayerAction(() => dispatch(bringToFront(elementId)), 'front')}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
      >
        <span>🔝</span>
        <span>Bring to Front</span>
        <span className="text-xs text-gray-400 ml-auto">Ctrl+&#125;</span>
      </button>
      
      <button
        onClick={() => handleLayerAction(() => dispatch(bringForward(elementId)), 'forward')}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
      >
        <span>⬆️</span>
        <span>Bring Forward</span>
        <span className="text-xs text-gray-400 ml-auto">Ctrl+]</span>
      </button>
      
      <button
        onClick={() => handleLayerAction(() => dispatch(sendBackward(elementId)), 'backward')}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
      >
        <span>⬇️</span>
        <span>Send Backward</span>
        <span className="text-xs text-gray-400 ml-auto">Ctrl+[</span>
      </button>
      
      <button
        onClick={() => handleLayerAction(() => dispatch(sendToBack(elementId)), 'back')}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
      >
        <span>🔻</span>
        <span>Send to Back</span>
        <span className="text-xs text-gray-400 ml-auto">Ctrl+&#123;</span>
      </button>

      <div className="border-t border-gray-200 my-1"></div>

      {/* Element Actions Section */}
      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Actions
      </div>
      
      <button
        onClick={handleDuplicate}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
      >
        <span>📋</span>
        <span>Duplicate</span>
        <span className="text-xs text-gray-400 ml-auto">Ctrl+D</span>
      </button>
      
      <button
        onClick={handleDelete}
        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
      >
        <span>🗑️</span>
        <span>Delete</span>
        <span className="text-xs text-gray-400 ml-auto">Del</span>
      </button>
    </div>
  )
}

export default ContextMenu
