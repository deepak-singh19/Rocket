import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useCanvas } from '../contexts/CanvasContext'
import axios from 'axios'

interface ThumbnailOptions {
  width?: number
  height?: number
  pixelRatio?: number
  quality?: number
}

export const useThumbnailGenerator = () => {
  const { elements, canvasSize } = useSelector((state: RootState) => state.canvas)
  const { stageRef } = useCanvas()

  // Generate thumbnail from canvas stage
  const generateThumbnail = useCallback(async (options: ThumbnailOptions = {}): Promise<string | null> => {
    const {
      width = 300,
      height = 200,
      pixelRatio = 0.5, // Small pixel ratio for smaller file size
      quality = 0.8
    } = options

    try {
      if (!stageRef.current) {
        console.warn('Stage ref not available for thumbnail generation')
        return null
      }

      const stage = stageRef.current
      
      // Get the original stage size
      const originalWidth = stage.width()
      const originalHeight = stage.height()
      
      // Calculate scale factors
      const scaleX = width / originalWidth
      const scaleY = height / originalHeight
      const scale = Math.min(scaleX, scaleY) // Maintain aspect ratio
      
      // Temporarily resize stage for thumbnail
      stage.size({ width: width / pixelRatio, height: height / pixelRatio })
      stage.scale({ x: scale / pixelRatio, y: scale / pixelRatio })
      
      // Generate data URL
      const dataUrl = stage.toDataURL({
        mimeType: 'image/png',
        pixelRatio,
        quality
      })
      
      // Restore original stage size and scale
      stage.size({ width: originalWidth, height: originalHeight })
      stage.scale({ x: 1, y: 1 })
      
      return dataUrl
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
      return null
    }
  }, [])

  // Upload thumbnail to server
  const uploadThumbnail = useCallback(async (designId: string, thumbnail: string): Promise<boolean> => {
    try {
      const response = await axios.post(`/api/designs/${designId}/thumbnail`, {
        thumbnail
      })
      
      return response.data.success
    } catch (error) {
      console.error('Failed to upload thumbnail:', error)
      return false
    }
  }, [])

  // Generate and upload thumbnail in one operation
  const generateAndUploadThumbnail = useCallback(async (
    designId: string, 
    options: ThumbnailOptions = {}
  ): Promise<boolean> => {
    try {
      const thumbnail = await generateThumbnail(options)
      if (!thumbnail) {
        return false
      }

      return await uploadThumbnail(designId, thumbnail)
    } catch (error) {
      console.error('Failed to generate and upload thumbnail:', error)
      return false
    }
  }, [generateThumbnail, uploadThumbnail])

  // Generate thumbnail with smart sizing based on canvas content
  const generateSmartThumbnail = useCallback(async (options: ThumbnailOptions = {}): Promise<string | null> => {
    const {
      maxWidth = 300,
      maxHeight = 200,
      pixelRatio = 0.5,
      quality = 0.8
    } = options

    try {
      if (!stageRef.current) {
        return null
      }

      const stage = stageRef.current
      
      // Calculate smart dimensions based on canvas content
      const canvasWidth = canvasSize.width
      const canvasHeight = canvasSize.height
      
      // Calculate aspect ratio
      const aspectRatio = canvasWidth / canvasHeight
      
      let thumbnailWidth = maxWidth
      let thumbnailHeight = maxHeight
      
      // Adjust dimensions to maintain aspect ratio
      if (aspectRatio > maxWidth / maxHeight) {
        thumbnailHeight = maxWidth / aspectRatio
      } else {
        thumbnailWidth = maxHeight * aspectRatio
      }
      
      // Ensure minimum size
      thumbnailWidth = Math.max(thumbnailWidth, 100)
      thumbnailHeight = Math.max(thumbnailHeight, 100)
      
      return await generateThumbnail({
        width: thumbnailWidth,
        height: thumbnailHeight,
        pixelRatio,
        quality
      })
    } catch (error) {
      console.error('Failed to generate smart thumbnail:', error)
      return null
    }
  }, [generateThumbnail, canvasSize])

  // Get thumbnail size estimate
  const getThumbnailSizeEstimate = useCallback((options: ThumbnailOptions = {}): number => {
    const {
      width = 300,
      height = 200,
      pixelRatio = 0.5,
      quality = 0.8
    } = options

    // Rough estimate: width * height * pixelRatio^2 * quality * 4 bytes per pixel
    const estimatedBytes = width * height * Math.pow(pixelRatio, 2) * quality * 4
    return Math.round(estimatedBytes / 1024) // Return size in KB
  }, [])

  return {
    generateThumbnail,
    uploadThumbnail,
    generateAndUploadThumbnail,
    generateSmartThumbnail,
    getThumbnailSizeEstimate
  }
}
