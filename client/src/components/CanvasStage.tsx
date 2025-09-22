import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Stage, Layer, Rect, Circle, Text, Image, Transformer, Group, Path } from 'react-konva'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { selectElement, clearSelection, updateElement, startDrawing, updateDrawing, finishDrawing, cancelDrawing, selectDrawingState, selectDrawingTool, transformElement, removeElement } from '../store/canvasSlice'
import { CanvasElement } from '../types'
import { CollaborationHookReturn } from '../hooks/useCollaboration'
import { useCanvas } from '../contexts/CanvasContext'
import { useComments } from '../hooks/useComments'
import ImageElement from './ImageElement'
import GhostElement from './GhostElement'
import UserCursor from './UserCursor'
import ContextMenu from './ContextMenu'
import CommentMarker from './CommentMarker'
import CommentsPanel from './CommentsPanel'
import Konva from 'konva'

interface CanvasStageProps {
  collaboration?: CollaborationHookReturn
}

const CanvasStage: React.FC<CanvasStageProps> = ({ collaboration }) => {
  const { stageRef } = useCanvas()
  const transformerRef = useRef<Konva.Transformer>(null)
  const dispatch = useDispatch<AppDispatch>()
  const { selectedElement, canvasSize, zoom, pan } = useSelector((state: RootState) => state.canvas)
  const elements = useSelector((state: RootState) => state.canvas.elements, shallowEqual)
  const sortedElements = useMemo(() => 
    [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [elements]
  )
  const { selectedDesign } = useSelector((state: RootState) => state.designs)
  const drawingState = useSelector(selectDrawingState)
  const drawingTool = useSelector(selectDrawingTool)
  
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    elementId: string | null
  } | null>(null)
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map())
  const [showComments, setShowComments] = useState(false)
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedCommentElementId, setSelectedCommentElementId] = useState<string | null>(null)
  const [isCommentMode, setIsCommentMode] = useState(false)

  // Collaboration with defaults
  const {
    isConnected = false,
    currentUser = null,
    roomUsers = [],
    ghostElements = [],
    userCursors = new Map(),
    broadcastElementOperation = () => {},
    broadcastCursorMove = () => {},
    broadcastElementDragStart = () => {},
    broadcastElementDragMove = () => {},
    broadcastElementDragEnd = () => {}
  } = collaboration || {}

  // Comments hook
  const commentsHook = useComments({
    designId: selectedDesign?._id || '',
    collaboration: collaboration ? {
      socket: collaboration.socket,
      currentUser: collaboration.currentUser
    } : undefined
  })

  // Group comments by position (for markers)
  const commentMarkers = useMemo(() => {
    const markers = new Map<string, { position: { x: number; y: number }; comments: any[]; hasUnresolved: boolean }>()
    
    commentsHook.comments.forEach(comment => {
      if (comment.position) {
        const key = `${Math.round(comment.position.x)}-${Math.round(comment.position.y)}`
        if (!markers.has(key)) {
          markers.set(key, {
            position: comment.position,
            comments: [],
            hasUnresolved: false
          })
        }
        const marker = markers.get(key)!
        marker.comments.push(comment)
        if (!comment.isResolved) {
          marker.hasUnresolved = true
        }
      }
    })
    
    return Array.from(markers.values())
  }, [commentsHook.comments])

  // Update stage size when container resizes
  useEffect(() => {
    const updateSize = () => {
      const container = stageRef.current?.container().parentElement
      if (container) {
        const rect = container.getBoundingClientRect()
        setStageSize({ width: rect.width - 32, height: rect.height - 32 })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedElement) {
      const selectedNode = stageRef.current?.findOne(`#${selectedElement}`)
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode])
        transformerRef.current.getLayer()?.batchDraw()
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [selectedElement])

  // Load image for image elements
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (imageCache.has(src)) {
        resolve(imageCache.get(src)!)
        return
      }

      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        setImageCache(prev => new Map(prev).set(src, image))
        resolve(image)
      }
      image.onerror = reject
      image.src = src
    })
  }

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicking on empty area, clear selection
    if (e.target === e.target.getStage()) {
      dispatch(clearSelection())
      
      // Handle comment mode - add comment at click position
      if (isCommentMode && e.evt.detail === 2) { // Double click to add comment
        const pos = e.target.getStage()?.getPointerPosition()
        if (pos) {
          // Convert screen coordinates to canvas coordinates
          const canvasPos = {
            x: (pos.x - pan.x) / zoom,
            y: (pos.y - pan.y) / zoom
          }
          setCommentPosition(canvasPos)
          setSelectedCommentElementId(null)
          setShowComments(true)
          setIsCommentMode(false)
        }
      }
    }
  }

  const handleElementClick = (elementId: string) => {

    dispatch(selectElement(elementId))
  }

  const handleElementRightClick = (e: Konva.KonvaEventObject<PointerEvent>, elementId: string) => {
    e.evt.preventDefault()
    const pos = e.target.getStage()?.getPointerPosition()
    if (pos) {
      setContextMenu({
        x: pos.x,
        y: pos.y,
        elementId: elementId
      })
    }
  }

  const handleCommentMarkerClick = (position: { x: number; y: number }) => {
    setCommentPosition(position)
    setSelectedCommentElementId(null)
    setShowComments(true)
  }

  const handleElementDoubleClick = (elementId: string) => {
    // Open comments for this element
    setSelectedCommentElementId(elementId)
    setCommentPosition(null)
    setShowComments(true)
  }

  const handleElementDragStart = (elementId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    broadcastElementDragStart(elementId, node.x(), node.y())
  }

  const handleElementDragMove = (elementId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    broadcastElementDragMove(elementId, node.x(), node.y())
  }

  const handleElementDragEnd = (elementId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    const updates = {
      x: node.x(),
      y: node.y()
    }
    
    // Apply local update
    dispatch(updateElement({
      id: elementId,
      updates
    }))
    
    // Broadcast to other users
    if (collaboration && collaboration.isConnected && collaboration.currentUser) {
      collaboration.broadcastElementOperation({
        type: 'element_updated',
        elementId,
        updates
      })
    }
    
    broadcastElementDragEnd(elementId, node.x(), node.y())
  }

  // Drawing event handlers
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    try {
      // Only start drawing if:
      // 1. A drawing tool is selected
      // 2. User is clicking on the stage or canvas background (not on an existing element)
      const isStageOrBackground = e.target === e.target.getStage() || e.target.getClassName() === 'Rect'
      
      if (drawingTool !== 'none' && isStageOrBackground) {
        const pos = e.target.getStage()?.getPointerPosition()
        if (pos) {
          dispatch(startDrawing({ x: pos.x, y: pos.y }))
        }
      }
    } catch (error) {
      console.error('Error in handleStageMouseDown:', error)
    }
  }

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    try {
      const pos = e.target.getStage()?.getPointerPosition()
      if (pos) {
        // Broadcast cursor movement
        broadcastCursorMove(pos.x, pos.y)
        
        // Update drawing if currently drawing
        if (drawingState.isDrawing) {
          dispatch(updateDrawing({ x: pos.x, y: pos.y }))
        }
      }
    } catch (error) {
      console.error('Error in handleStageMouseMove:', error)
    }
  }

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    try {
      if (drawingState.isDrawing) {
        // Generate element ID once for consistency
        const elementId = `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Store path data before calling finishDrawing (which resets it)
        const pathData = drawingState.currentPath
        const tool = drawingTool
        const color = drawingState.color
        const strokeWidth = drawingState.strokeWidth
        
        // Create the element locally - autosave will handle server persistence
        dispatch(finishDrawing({ elementId }))
        
        // Broadcast drawing to other users
        if (selectedDesign && collaboration && collaboration.isConnected && collaboration.currentUser) {
          collaboration.broadcastElementOperation({
            type: 'element_added',
            elementId: elementId,
            element: {
              id: elementId,
              type: 'drawing',
              x: 0,
              y: 0,
              pathData: pathData,
              tool: tool,
              stroke: color,
              strokeWidth: strokeWidth,
              fill: 'transparent',
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
    } catch (error) {
      console.error('Error in handleStageMouseUp:', error)
    }
  }

  const handleElementTransformEnd = (elementId: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target
    const element = sortedElements.find(el => el.id === elementId)
    
    if (!element) return

    const updates: Partial<CanvasElement> = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY()
    }

    // For elements with width/height, update those too
    if (element.type === 'rect' || element.type === 'image' || element.type === 'text') {
      // Get the original width/height before scaling
      const originalWidth = node.width() / node.scaleX()
      const originalHeight = node.height() / node.scaleY()
      
      // Calculate new dimensions based on current scale
      updates.width = originalWidth * node.scaleX()
      updates.height = originalHeight * node.scaleY()
      updates.scaleX = 1
      updates.scaleY = 1
    }

    // For circles, update radius
    if (element.type === 'circle') {
      updates.radius = node.radius() * Math.max(node.scaleX(), node.scaleY())
      updates.scaleX = 1
      updates.scaleY = 1
    }

    // Apply local update
    dispatch(updateElement({
      id: elementId,
      updates
    }))
    
    // Broadcast to other users
    if (collaboration && collaboration.isConnected && collaboration.currentUser) {
      collaboration.broadcastElementOperation({
        type: 'element_transformed',
        elementId,
        updates
      })
    }
  }

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElement === element.id
    
    
    const commonProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      fill: element.fill,
      stroke: element.stroke,
      strokeWidth: element.strokeWidth,
      opacity: element.opacity,
      rotation: element.rotation || 0,
      scaleX: element.scaleX || 1,
      scaleY: element.scaleY || 1,
      visible: element.visible !== false,
      draggable: true,
      onClick: () => handleElementClick(element.id),
      onDblClick: () => handleElementDoubleClick(element.id),
      onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => handleElementDragStart(element.id, e),
      onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => handleElementDragMove(element.id, e),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleElementDragEnd(element.id, e),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleElementTransformEnd(element.id, e)
    }

    switch (element.type) {
      case 'rect':
        return (
          <Rect
            {...commonProps}
            width={element.width || 100}
            height={element.height || 100}
            cornerRadius={element.borderRadius || 0}
          />
        )
      
      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={element.radius || 50}
          />
        )
      
      case 'text':
        return (
          <Text
            {...commonProps}
            text={element.text || 'Text'}
            fontSize={element.fontSize || 16}
            fontFamily={element.fontFamily || 'Arial'}
            fontStyle={element.fontWeight === 'bold' ? 'bold' : 'normal'}
            width={element.width || 200}
            height={element.height || 40}
            align="center"
            verticalAlign="middle"
          />
        )
      
      case 'image':
        return (
          <ImageElement
            {...commonProps}
            element={element}
            imageCache={imageCache}
            loadImage={loadImage}
          />
        )
      
        case 'drawing':
          return (
          <Group
            {...commonProps}
            draggable={drawingTool === 'none'} // Only draggable when not drawing
            onContextMenu={(e) => handleElementRightClick(e, element.id)}
          >
            {element.pathData && (
              <Path
                data={element.pathData}
                stroke={element.stroke || '#000000'}
                strokeWidth={element.strokeWidth || 2}
                fill="transparent"
                lineCap="round"
                lineJoin="round"
              />
            )}
          </Group>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={zoom}
          scaleY={zoom}
          x={pan.x}
          y={pan.y}
          onClick={handleStageClick}
          onTap={handleStageClick}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
          <Layer>
            {/* Canvas background */}
            <Rect
              x={0}
              y={0}
              width={canvasSize.width}
              height={canvasSize.height}
              fill="#ffffff"
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            
            {/* Grid lines (optional) */}
            {zoom > 0.5 && (
              <>
                {/* Vertical grid lines */}
                {Array.from({ length: Math.ceil(canvasSize.width / 50) }, (_, i) => (
                  <Rect
                    key={`v-${i}`}
                    x={i * 50}
                    y={0}
                    width={1}
                    height={canvasSize.height}
                    fill="#f3f4f6"
                  />
                ))}
                {/* Horizontal grid lines */}
                {Array.from({ length: Math.ceil(canvasSize.height / 50) }, (_, i) => (
                  <Rect
                    key={`h-${i}`}
                    x={0}
                    y={i * 50}
                    width={canvasSize.width}
                    height={1}
                    fill="#f3f4f6"
                  />
                ))}
              </>
            )}
            
            {/* Canvas elements */}
            {sortedElements.map(element => (
              <React.Fragment key={element.id}>
                {renderElement(element)}
              </React.Fragment>
            ))}
            
            {/* Ghost elements (other users dragging) */}
            {ghostElements.map(ghost => (
              <GhostElement key={ghost.id} ghost={ghost} />
            ))}
            
            {/* User cursors */}
            {Array.from(userCursors.entries()).map(([userId, cursor]) => (
              <UserCursor
                key={userId}
                userId={userId}
                userName={cursor.name}
                userColor={cursor.color}
                x={cursor.x}
                y={cursor.y}
              />
            ))}
            
            {/* Current drawing path */}
            {drawingState.isDrawing && drawingState.currentPath && (
              <Path
                data={drawingState.currentPath}
                stroke={drawingState.color}
                strokeWidth={drawingState.strokeWidth}
                fill="transparent"
                lineCap="round"
                lineJoin="round"
                opacity={0.7}
              />
            )}
            
            {/* Transformer for selected element */}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit resize
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox
                }
                return newBox
              }}
              onTransform={(e) => {
                const node = e.target
                const elementId = node.id()
                const element = sortedElements.find(el => el.id === elementId)
                
                if (element) {
                  dispatch(transformElement({
                    id: elementId,
                    transform: {
                      x: node.x(),
                      y: node.y(),
                      width: node.width() * node.scaleX(),
                      height: node.height() * node.scaleY(),
                      rotation: node.rotation(),
                      scaleX: node.scaleX(),
                      scaleY: node.scaleY()
                    }
                  }))
                }
              }}
              onTransformEnd={(e) => {
                const node = e.target
                const elementId = node.id()
                const element = sortedElements.find(el => el.id === elementId)
                
                if (element) {
                  // Reset scale and update dimensions
                  dispatch(transformElement({
                    id: elementId,
                    transform: {
                      x: node.x(),
                      y: node.y(),
                      width: node.width() * node.scaleX(),
                      height: node.height() * node.scaleY(),
                      rotation: node.rotation(),
                      scaleX: 1,
                      scaleY: 1
                    }
                  }))
                  
              // Reset transformer scale
              node.scaleX(1)
              node.scaleY(1)
              
              // Send refresh signal to other users
              if (collaboration && collaboration.isConnected && collaboration.broadcastRefreshSignal) {
                collaboration.broadcastRefreshSignal()
              }
            }
          }}
        />
          </Layer>
        </Stage>
        
        {/* Canvas info overlay */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {canvasSize.width} × {canvasSize.height} • Zoom: {Math.round(zoom * 100)}%
        </div>

        {/* Comment mode indicator */}
        {isCommentMode && (
          <div className="absolute top-2 left-2 bg-blue-100 border border-blue-300 text-blue-800 text-sm px-3 py-2 rounded-lg shadow-lg">
            💬 Comment Mode Active - Double-click to add a comment
            <button
              onClick={() => setIsCommentMode(false)}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Comment markers */}
        {commentMarkers.map((marker, index) => (
          <CommentMarker
            key={index}
            position={{
              x: marker.position.x * zoom + pan.x,
              y: marker.position.y * zoom + pan.y
            }}
            commentCount={marker.comments.length}
            hasUnresolved={marker.hasUnresolved}
            onClick={() => handleCommentMarkerClick(marker.position)}
          />
        ))}

        {/* Comment toggle button */}
        <button
          onClick={() => setIsCommentMode(!isCommentMode)}
          className={`absolute top-2 right-2 w-10 h-10 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
            isCommentMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
          title={isCommentMode ? 'Exit comment mode' : 'Enter comment mode'}
        >
          💬
        </button>

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            elementId={contextMenu.elementId}
            onClose={() => setContextMenu(null)}
            collaboration={collaboration}
          />
        )}
      </div>

      {/* Click outside to close context menu */}
      {contextMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setContextMenu(null)}
        />
      )}

      {/* Comments Panel */}
      {showComments && selectedDesign && (
        <CommentsPanel
          designId={selectedDesign._id}
          selectedElementId={selectedCommentElementId}
          position={commentPosition}
          onClose={() => {
            setShowComments(false)
            setCommentPosition(null)
            setSelectedCommentElementId(null)
          }}
          collaboration={collaboration ? {
            socket: collaboration.socket,
            currentUser: collaboration.currentUser
          } : undefined}
        />
      )}
    </div>
  )
}

export default CanvasStage
