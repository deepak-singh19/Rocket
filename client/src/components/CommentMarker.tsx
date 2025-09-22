import React from 'react'

interface CommentMarkerProps {
  position: { x: number; y: number }
  commentCount: number
  hasUnresolved?: boolean
  onClick: () => void
  className?: string
}

const CommentMarker: React.FC<CommentMarkerProps> = ({
  position,
  commentCount,
  hasUnresolved = false,
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`absolute z-20 flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
        hasUnresolved 
          ? 'bg-orange-500 text-white animate-pulse' 
          : 'bg-blue-500 text-white'
      } ${className}`}
      style={{
        left: position.x - 16, // Center the 32px (w-8) button
        top: position.y - 16,
        transform: 'translate(0, 0)' // Reset any transform
      }}
      title={`${commentCount} comment${commentCount !== 1 ? 's' : ''} • Click to view`}
    >
      <div className="flex flex-col items-center justify-center">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
        {commentCount > 1 && (
          <span className="text-xs font-bold leading-none">{commentCount}</span>
        )}
      </div>
      
      {/* Unresolved indicator */}
      {hasUnresolved && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
      )}
    </button>
  )
}

export default CommentMarker
