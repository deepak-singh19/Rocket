import { useCallback } from 'react'
import Konva from 'konva'

interface DownloadOptions {
  pixelRatio?: number
  mimeType?: string
  quality?: number
}

export const useDownloadCanvas = () => {
  const downloadCanvas = useCallback((
    stageRef: React.RefObject<Konva.Stage>,
    filename: string,
    options: DownloadOptions = {}
  ) => {
    if (!stageRef.current) {
      console.error('Stage reference is not available')
      return
    }

    const {
      pixelRatio = 2,
      mimeType = 'image/png',
      quality = 1
    } = options

    try {
      // Generate data URL from Konva stage
      const dataUrl = stageRef.current.toDataURL({
        pixelRatio,
        mimeType,
        quality
      })

      // Create download link
      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl

      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error('Failed to download canvas:', error)
      throw new Error('Failed to generate download file')
    }
  }, [])

  const generateFilename = useCallback((designName: string, timestamp?: Date): string => {
    const now = timestamp || new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
    
    // Clean design name for filename
    const cleanName = designName
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50) // Limit length
    
    return `${cleanName}_${dateStr}_${timeStr}.png`
  }, [])

  return {
    downloadCanvas,
    generateFilename
  }
}
