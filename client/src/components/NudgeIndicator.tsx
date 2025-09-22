import React, { useState, useEffect } from 'react'

interface NudgeIndicatorProps {
  direction: 'up' | 'down' | 'left' | 'right'
  distance: number
  elementId: string
}

const NudgeIndicator: React.FC<NudgeIndicatorProps> = ({ direction, distance, elementId }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => setIsVisible(false), 300)
    return () => clearTimeout(timer)
  }, [direction, distance])

  if (!isVisible) return null

  const getDirectionIcon = () => {
    switch (direction) {
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      case 'left':
        return '←'
      case 'right':
        return '→'
      default:
        return '↔'
    }
  }

  const getDirectionClass = () => {
    switch (direction) {
      case 'up':
        return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full'
      case 'down':
        return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full'
      case 'left':
        return 'left-0 top-1/2 transform -translate-y-1/2 -translate-x-full'
      case 'right':
        return 'right-0 top-1/2 transform -translate-y-1/2 translate-x-full'
      default:
        return ''
    }
  }

  return (
    <div
      className={`
        absolute z-50 pointer-events-none
        ${getDirectionClass()}
        animate-pulse
      `}
    >
      <div className="bg-blue-600 text-white px-2 py-1 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-1">
        <span className="text-lg">{getDirectionIcon()}</span>
        <span>{distance}px</span>
      </div>
    </div>
  )
}

export default NudgeIndicator
