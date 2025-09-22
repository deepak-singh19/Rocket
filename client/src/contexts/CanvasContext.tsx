import React, { createContext, useContext, useRef, ReactNode } from 'react'
import Konva from 'konva'

interface CanvasContextType {
  stageRef: React.RefObject<Konva.Stage>
}

const CanvasContext = createContext<CanvasContextType | null>(null)

interface CanvasProviderProps {
  children: ReactNode
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({ children }) => {
  const stageRef = useRef<Konva.Stage>(null)

  return (
    <CanvasContext.Provider value={{ stageRef }}>
      {children}
    </CanvasContext.Provider>
  )
}

export const useCanvas = (): CanvasContextType => {
  const context = useContext(CanvasContext)
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider')
  }
  return context
}
