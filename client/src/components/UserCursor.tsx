import React from 'react'
import { Circle, Text, Group, Rect } from 'react-konva'

interface User {
  id: string
  name: string
  cursor?: { x: number; y: number }
}

interface UserCursorProps {
  user: User
  currentUserId?: string
}

const UserCursor: React.FC<UserCursorProps> = ({ user, currentUserId }) => {
  // Don't show cursor for current user or if no cursor position
  if (!user.cursor || user.id === currentUserId) {
    return null
  }

  // Generate a consistent color for each user based on their ID
  const getColorFromId = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 60%)`
  }

  const cursorColor = getColorFromId(user.id)

  return (
    <Group
      x={user.cursor.x}
      y={user.cursor.y}
      listening={false} // Don't interfere with canvas interactions
    >
      {/* Cursor pointer */}
      <Circle
        x={0}
        y={0}
        radius={4}
        fill={cursorColor}
        stroke="white"
        strokeWidth={2}
      />
      
      {/* User name label */}
      <Group x={8} y={-8}>
        {/* Background rectangle */}
        <Rect
          x={-2}
          y={-2}
          width={user.name.length * 7 + 8}
          height={16}
          fill={cursorColor}
          cornerRadius={4}
          shadowColor="rgba(0,0,0,0.3)"
          shadowBlur={2}
          shadowOffset={{ x: 1, y: 1 }}
        />
        {/* Text */}
        <Text
          x={2}
          y={1}
          text={user.name}
          fontSize={12}
          fontFamily="Arial, sans-serif"
          fill="white"
        />
      </Group>
    </Group>
  )
}

export default UserCursor