import React from 'react'
import { Group, Rect, Circle, Line } from 'react-konva'
import { CanvasElement } from '../types'

interface SelectionHandlesProps {
  element: CanvasElement
  onTransform: (transform: {
    x?: number
    y?: number
    width?: number
    height?: number
    rotation?: number
  }) => void
  onTransformEnd: () => void
}

const HANDLE_SIZE = 8
const HANDLE_COLOR = '#007AFF'
const HANDLE_STROKE = '#FFFFFF'
const HANDLE_STROKE_WIDTH = 2

export const SelectionHandles: React.FC<SelectionHandlesProps> = ({
  element,
  onTransform,
  onTransformEnd
}) => {
  const { x, y, width, height, rotation = 0 } = element

  // Calculate bounding box corners
  const corners = [
    { x: x, y: y }, // Top-left
    { x: x + width, y: y }, // Top-right
    { x: x + width, y: y + height }, // Bottom-right
    { x: x, y: y + height } // Bottom-left
  ]

  // Calculate center point
  const centerX = x + width / 2
  const centerY = y + height / 2

  // Calculate edge midpoints
  const midpoints = [
    { x: centerX, y: y }, // Top
    { x: x + width, y: centerY }, // Right
    { x: centerX, y: y + height }, // Bottom
    { x: x, y: centerY } // Left
  ]

  const handleCornerDrag = (index: number) => (e: any) => {
    const stage = e.target.getStage()
    const pointerPosition = stage.getPointerPosition()
    
    if (!pointerPosition) return

    const newX = pointerPosition.x
    const newY = pointerPosition.y

    let newWidth = width
    let newHeight = height
    let newElementX = x
    let newElementY = y

    switch (index) {
      case 0: // Top-left
        newWidth = width + (x - newX)
        newHeight = height + (y - newY)
        newElementX = newX
        newElementY = newY
        break
      case 1: // Top-right
        newWidth = newX - x
        newHeight = height + (y - newY)
        newElementY = newY
        break
      case 2: // Bottom-right
        newWidth = newX - x
        newHeight = newY - y
        break
      case 3: // Bottom-left
        newWidth = width + (x - newX)
        newHeight = newY - y
        newElementX = newX
        break
    }

    // Ensure minimum size
    if (newWidth < 10) newWidth = 10
    if (newHeight < 10) newHeight = 10

    onTransform({
      x: newElementX,
      y: newElementY,
      width: newWidth,
      height: newHeight
    })
  }

  const handleEdgeDrag = (index: number) => (e: any) => {
    const stage = e.target.getStage()
    const pointerPosition = stage.getPointerPosition()
    
    if (!pointerPosition) return

    const newX = pointerPosition.x
    const newY = pointerPosition.y

    let newWidth = width
    let newHeight = height
    let newElementX = x
    let newElementY = y

    switch (index) {
      case 0: // Top edge
        newHeight = height + (y - newY)
        newElementY = newY
        break
      case 1: // Right edge
        newWidth = newX - x
        break
      case 2: // Bottom edge
        newHeight = newY - y
        break
      case 3: // Left edge
        newWidth = width + (x - newX)
        newElementX = newX
        break
    }

    // Ensure minimum size
    if (newWidth < 10) newWidth = 10
    if (newHeight < 10) newHeight = 10

    onTransform({
      x: newElementX,
      y: newElementY,
      width: newWidth,
      height: newHeight
    })
  }

  const handleRotation = (e: any) => {
    const stage = e.target.getStage()
    const pointerPosition = stage.getPointerPosition()
    
    if (!pointerPosition) return

    const dx = pointerPosition.x - centerX
    const dy = pointerPosition.y - centerY
    const newRotation = Math.atan2(dy, dx) * (180 / Math.PI)

    onTransform({ rotation: newRotation })
  }

  return (
    <Group>
      {/* Bounding box outline */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={HANDLE_COLOR}
        strokeWidth={1}
        fill="transparent"
        dash={[5, 5]}
      />

      {/* Corner handles */}
      {corners.map((corner, index) => (
        <Circle
          key={`corner-${index}`}
          x={corner.x}
          y={corner.y}
          radius={HANDLE_SIZE / 2}
          fill={HANDLE_COLOR}
          stroke={HANDLE_STROKE}
          strokeWidth={HANDLE_STROKE_WIDTH}
          draggable
          onDragMove={handleCornerDrag(index)}
          onDragEnd={onTransformEnd}
        />
      ))}

      {/* Edge handles */}
      {midpoints.map((midpoint, index) => (
        <Circle
          key={`edge-${index}`}
          x={midpoint.x}
          y={midpoint.y}
          radius={HANDLE_SIZE / 2}
          fill={HANDLE_COLOR}
          stroke={HANDLE_STROKE}
          strokeWidth={HANDLE_STROKE_WIDTH}
          draggable
          onDragMove={handleEdgeDrag(index)}
          onDragEnd={onTransformEnd}
        />
      ))}

      {/* Rotation handle */}
      <Line
        points={[centerX, centerY, centerX, centerY - 30]}
        stroke={HANDLE_COLOR}
        strokeWidth={2}
      />
      <Circle
        x={centerX}
        y={centerY - 30}
        radius={HANDLE_SIZE / 2}
        fill={HANDLE_COLOR}
        stroke={HANDLE_STROKE}
        strokeWidth={HANDLE_STROKE_WIDTH}
        draggable
        onDragMove={handleRotation}
        onDragEnd={onTransformEnd}
      />
    </Group>
  )
}

export default SelectionHandles
