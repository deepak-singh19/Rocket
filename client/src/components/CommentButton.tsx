import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import CommentsPanel from './CommentsPanel'

interface CommentButtonProps {
  elementId?: string
  x: number
  y: number
  visible?: boolean
}

const CommentButton: React.FC<CommentButtonProps> = ({
  elementId,
  x,
  y,
  visible = true
}) => {
  const { selectedDesign } = useSelector((state: RootState) => state.designs)
  const [showComments, setShowComments] = useState(false)

  if (!visible || !selectedDesign) return null

  // Count comments for this element
  const commentCount = selectedDesign.comments?.filter(comment => 
    elementId ? comment.elementId === elementId : !comment.elementId
  ).length || 0

  return (
    <>
      <button
        onClick={() => setShowComments(true)}
        className="absolute z-10 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium shadow-lg transition-colors"
        style={{
          left: x - 4,
          top: y - 4,
          transform: 'translate(-50%, -50%)'
        }}
        title={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
      >
        💬
        {commentCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {commentCount}
          </span>
        )}
      </button>

      {showComments && (
        <CommentsPanel
          designId={selectedDesign._id}
          selectedElementId={elementId}
          onClose={() => setShowComments(false)}
        />
      )}
    </>
  )
}

export default CommentButton
