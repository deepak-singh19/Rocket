import React from 'react'
import { Rect, Circle, Text, Group } from 'react-konva'
import { GhostElement as GhostElementType } from '../types/collaboration'

interface GhostElementProps {
  ghost: GhostElementType
}

const GhostElement: React.FC<GhostElementProps> = ({ ghost }) => {
  const renderGhostShape = () => {
    const commonProps = {
      x: ghost.x,
      y: ghost.y,
      opacity: 0.6,
      stroke: ghost.userColor,
      strokeWidth: 2,
      dash: [5, 5]
    }

    switch (ghost.type) {
      case 'rect':
        return (
          <Rect
            {...commonProps}
            width={ghost.width || 100}
            height={ghost.height || 100}
          />
        )
      
      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={ghost.radius || 50}
          />
        )
      
      case 'text':
        return (
          <Rect
            {...commonProps}
            width={ghost.width || 200}
            height={ghost.height || 40}
            fill="transparent"
          />
        )
      
      case 'image':
        return (
          <Rect
            {...commonProps}
            width={ghost.width || 200}
            height={ghost.height || 150}
            fill="transparent"
          />
        )
      
      default:
        return (
          <Rect
            {...commonProps}
            width={ghost.width || 100}
            height={ghost.height || 100}
            fill="transparent"
          />
        )
    }
  }

  return (
    <Group>
      {renderGhostShape()}
      {/* User label */}
      <Text
        x={ghost.x}
        y={ghost.y - 20}
        text={ghost.userName}
        fontSize={12}
        fill={ghost.userColor}
        fontStyle="bold"
        shadowColor="white"
        shadowBlur={2}
        shadowOffset={{ x: 1, y: 1 }}
      />
    </Group>
  )
}

export default GhostElement
