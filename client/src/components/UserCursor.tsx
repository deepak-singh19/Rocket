import React from 'react'
import { Group, Line, Text } from 'react-konva'

interface UserCursorProps {
  userId: string
  userName: string
  userColor: string
  x: number
  y: number
}

const UserCursor: React.FC<UserCursorProps> = ({
  userId,
  userName,
  userColor,
  x,
  y
}) => {
  return (
    <Group>
      {/* Cursor pointer */}
      <Line
        points={[x, y, x + 10, y + 10]}
        stroke={userColor}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[x + 10, y, x, y + 10]}
        stroke={userColor}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      />
      
      {/* User name label */}
      <Text
        x={x + 15}
        y={y - 5}
        text={userName}
        fontSize={12}
        fill={userColor}
        fontStyle="bold"
        shadowColor="white"
        shadowBlur={2}
        shadowOffset={{ x: 1, y: 1 }}
      />
    </Group>
  )
}

export default UserCursor
