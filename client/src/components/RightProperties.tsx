import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { updateElement, addElement } from '../store/canvasSlice'
import { CanvasElement } from '../types'
import { CollaborationHookReturn } from '../hooks/useCollaboration'

interface RightPropertiesProps {
  collaboration?: CollaborationHookReturn
}

const RightProperties: React.FC<RightPropertiesProps> = ({ collaboration }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { elements, selectedElement } = useSelector((state: RootState) => state.canvas)

  const selectedElementData = elements.find(el => el.id === selectedElement)

  const handlePropertyChange = (property: string, value: any) => {
    if (!selectedElement) return
    
    const updates = { [property]: value }
    
    // Apply local update
    dispatch(updateElement({
      id: selectedElement,
      updates
    }))
    
    // Broadcast to other users
    if (collaboration && collaboration.isConnected && collaboration.currentUser && collaboration.broadcastElementOperation) {
      collaboration.broadcastElementOperation({
        type: 'element_updated',
        elementId: selectedElement,
        updates
      })
    }
  }

  const addNewElement = (type: CanvasElement['type']) => {
    const newElement: CanvasElement = {
      id: `${type}_${Date.now()}`,
      type,
      x: 100,
      y: 100,
      fill: '#3b82f6',
      stroke: '#1d4ed8',
      strokeWidth: 2,
      opacity: 1,
      visible: true,
      locked: false,
      ...(type === 'rect' && { width: 100, height: 100 }),
      ...(type === 'circle' && { radius: 50 }),
      ...(type === 'text' && { 
        text: 'New Text', 
        fontSize: 16, 
        fontFamily: 'Arial, sans-serif',
        width: 100,
        height: 30
      }),
      ...(type === 'image' && { 
        width: 200, 
        height: 150, 
        src: 'https://via.placeholder.com/200x150/6366f1/ffffff?text=Image'
      })
    }

    // Apply local update
    dispatch(addElement(newElement))
    
    // Broadcast to other users
    if (collaboration && collaboration.isConnected && collaboration.currentUser && collaboration.broadcastElementOperation) {
      collaboration.broadcastElementOperation({
        type: 'element_added',
        elementId: newElement.id,
        element: newElement
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Properties</h2>
        <p className="text-sm text-gray-500 mt-1">
          {selectedElement ? 'Element Properties' : 'Add Elements'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedElement && selectedElementData ? (
          <div className="p-4 space-y-6">
            {/* Position */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Position</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">X</label>
                  <input
                    type="number"
                    value={Math.round(selectedElementData.x)}
                    onChange={(e) => handlePropertyChange('x', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedElementData.y)}
                    onChange={(e) => handlePropertyChange('y', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Size */}
            {(selectedElementData.type === 'rect' || selectedElementData.type === 'image') && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Size</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Width</label>
                    <input
                      type="number"
                      value={Math.round(selectedElementData.width || 0)}
                      onChange={(e) => handlePropertyChange('width', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Height</label>
                    <input
                      type="number"
                      value={Math.round(selectedElementData.height || 0)}
                      onChange={(e) => handlePropertyChange('height', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Circle Radius */}
            {selectedElementData.type === 'circle' && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Size</h3>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Radius</label>
                  <input
                    type="number"
                    value={Math.round(selectedElementData.radius || 0)}
                    onChange={(e) => handlePropertyChange('radius', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Text Properties */}
            {selectedElementData.type === 'text' && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Text</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Content</label>
                    <textarea
                      value={selectedElementData.text || ''}
                      onChange={(e) => handlePropertyChange('text', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                    <input
                      type="range"
                      min="8"
                      max="120"
                      value={selectedElementData.fontSize || 16}
                      onChange={(e) => handlePropertyChange('fontSize', parseFloat(e.target.value) || 16)}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      {selectedElementData.fontSize || 16}px
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Font Family</label>
                    <select
                      value={selectedElementData.fontFamily || 'Arial'}
                      onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Times New Roman, serif">Times New Roman</option>
                      <option value="Courier New, monospace">Courier New</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={selectedElementData.fill || '#000000'}
                        onChange={(e) => handlePropertyChange('fill', e.target.value)}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedElementData.fill || '#000000'}
                        onChange={(e) => handlePropertyChange('fill', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedElementData.fontWeight === 'bold'}
                        onChange={(e) => handlePropertyChange('fontWeight', e.target.checked ? 'bold' : 'normal')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-xs text-gray-600">Bold</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Image Properties */}
            {selectedElementData.type === 'image' && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Image</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={selectedElementData.src || ''}
                      onChange={(e) => handlePropertyChange('src', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={selectedElementData.opacity || 1}
                      onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round((selectedElementData.opacity || 1) * 100)}%
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Fit Mode</label>
                    <select
                      value={selectedElementData.fitMode || 'cover'}
                      onChange={(e) => handlePropertyChange('fitMode', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Border Radius</label>
                    <input
                      type="number"
                      value={selectedElementData.borderRadius || 0}
                      onChange={(e) => handlePropertyChange('borderRadius', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Shape Properties */}
            {(selectedElementData.type === 'rect' || selectedElementData.type === 'circle') && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Shape</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Fill Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={selectedElementData.fill || '#3b82f6'}
                        onChange={(e) => handlePropertyChange('fill', e.target.value)}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedElementData.fill || '#3b82f6'}
                        onChange={(e) => handlePropertyChange('fill', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Stroke Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={selectedElementData.stroke || '#1d4ed8'}
                        onChange={(e) => handlePropertyChange('stroke', e.target.value)}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedElementData.stroke || '#1d4ed8'}
                        onChange={(e) => handlePropertyChange('stroke', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Stroke Width</label>
                    <input
                      type="number"
                      value={selectedElementData.strokeWidth || 2}
                      onChange={(e) => handlePropertyChange('strokeWidth', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                      max="20"
                    />
                  </div>
                  {selectedElementData.type === 'rect' && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Border Radius</label>
                      <input
                        type="number"
                        value={selectedElementData.borderRadius || 0}
                        onChange={(e) => handlePropertyChange('borderRadius', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        min="0"
                        max="50"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Common Appearance */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Appearance</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedElementData.opacity || 1}
                    onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((selectedElementData.opacity || 1) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Transform */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Transform</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Rotation</label>
                  <input
                    type="number"
                    value={selectedElementData.rotation || 0}
                    onChange={(e) => handlePropertyChange('rotation', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Scale X</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedElementData.scaleX || 1}
                      onChange={(e) => handlePropertyChange('scaleX', parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Scale Y</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedElementData.scaleY || 1}
                      onChange={(e) => handlePropertyChange('scaleY', parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Add Elements</h3>
            <div className="space-y-2">
              <button
                onClick={() => addNewElement('rect')}
                className="w-full flex items-center space-x-3 p-3 text-left border border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="text-lg">⬜</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Rectangle</div>
                  <div className="text-xs text-gray-500">Add a rectangular shape</div>
                </div>
              </button>
              
              <button
                onClick={() => addNewElement('circle')}
                className="w-full flex items-center space-x-3 p-3 text-left border border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="text-lg">⭕</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Circle</div>
                  <div className="text-xs text-gray-500">Add a circular shape</div>
                </div>
              </button>
              
              <button
                onClick={() => addNewElement('text')}
                className="w-full flex items-center space-x-3 p-3 text-left border border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="text-lg">📝</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Text</div>
                  <div className="text-xs text-gray-500">Add text element</div>
                </div>
              </button>
              
              <button
                onClick={() => addNewElement('image')}
                className="w-full flex items-center space-x-3 p-3 text-left border border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="text-lg">🖼️</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Image</div>
                  <div className="text-xs text-gray-500">Add an image</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RightProperties
