import React from 'react'

interface User {
  id: string
  name: string
  cursor?: { x: number; y: number }
}

interface PresenceIndicatorProps {
  users: User[]
  currentUser: User | null
  isConnected: boolean
}

const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ 
  users, 
  currentUser, 
  isConnected 
}) => {
  // Filter out current user from the list
  const otherUsers = users.filter(user => user.id !== currentUser?.id)

  return (
    <div className="flex items-center space-x-2">
      {/* Connection Status */}
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
      
      {/* User Count */}
      <span className="text-sm text-gray-600">
        {isConnected ? `${users.length} user${users.length !== 1 ? 's' : ''} online` : 'Offline'}
      </span>
      
      {/* User Avatars */}
      {otherUsers.length > 0 && (
        <div className="flex -space-x-1">
          {otherUsers.slice(0, 3).map((user) => (
            <div
              key={user.id}
              className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {otherUsers.length > 3 && (
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
              +{otherUsers.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PresenceIndicator
