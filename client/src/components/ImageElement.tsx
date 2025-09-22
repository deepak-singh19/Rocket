import React, { useEffect, useState } from 'react'
import { Image } from 'react-konva'
import { CanvasElement } from '../types'

interface ImageElementProps {
  element: CanvasElement
  imageCache: Map<string, HTMLImageElement>
  loadImage: (src: string) => Promise<HTMLImageElement>
  [key: string]: any // For other Konva props
}

const ImageElement: React.FC<ImageElementProps> = ({ 
  element, 
  imageCache, 
  loadImage, 
  ...konvaProps 
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!element.src) return

    const loadImageElement = async () => {
      setLoading(true)
      try {
        const img = await loadImage(element.src!)
        setImage(img)
      } catch (error) {
        console.error('Failed to load image:', error)
        // Create a placeholder image
        const placeholder = new Image()
        placeholder.width = 200
        placeholder.height = 150
        setImage(placeholder)
      } finally {
        setLoading(false)
      }
    }

    loadImageElement()
  }, [element.src, loadImage])

  if (loading) {
    return (
      <Image
        {...konvaProps}
        width={element.width || 200}
        height={element.height || 150}
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth={1}
      />
    )
  }

  return (
    <Image
      {...konvaProps}
      image={image}
      width={element.width || 200}
      height={element.height || 150}
      cornerRadius={element.borderRadius || 0}
    />
  )
}

export default ImageElement
