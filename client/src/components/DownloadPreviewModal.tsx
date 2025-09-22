import React, { useState, useRef, useEffect } from 'react'
import Konva from 'konva'
import { Stage, Layer, Rect, Circle, Text, Image } from 'react-konva'
import { CanvasElement } from '../types'
import { useDownloadCanvas } from '../hooks/useDownloadCanvas'

interface DownloadPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
  elements: CanvasElement[]
  canvasSize: { width: number; height: number }
  designName: string
}

const DownloadPreviewModal: React.FC<DownloadPreviewModalProps> = ({
  isOpen,
  onClose,
  onDownload,
  elements,
  canvasSize,
  designName
}) => {
  const stageRef = useRef<Konva.Stage>(null)
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map())
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('')
  const { downloadCanvas, generateFilename } = useDownloadCanvas()

  // Load image for image elements
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (imageCache.has(src)) {
        resolve(imageCache.get(src)!)
        return
      }

      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        setImageCache(prev => new Map(prev).set(src, image))
        resolve(image)
      }
      image.onerror = reject
      image.src = src
    })
  }

  // Generate preview when modal opens
  useEffect(() => {
    if (isOpen && stageRef.current) {
      // Wait for images to load, then generate preview
      const generatePreview = async () => {
        // Load all images first
        const imagePromises = elements
          .filter(el => el.type === 'image' && el.src)
          .map(el => loadImage(el.src!))
        
        await Promise.all(imagePromises)
        
        // Generate preview after a short delay to ensure rendering is complete
        setTimeout(() => {
          if (stageRef.current) {
            const dataUrl = stageRef.current.toDataURL({ 
              pixelRatio: 2,
              mimeType: 'image/png',
              quality: 1
            })
            setPreviewDataUrl(dataUrl)
          }
        }, 100)
      }

      generatePreview()
    }
  }, [isOpen, elements])

  const handleDownload = () => {
    try {
      const filename = generateFilename(designName)
      downloadCanvas(stageRef, filename, {
        pixelRatio: 2,
        mimeType: 'image/png',
        quality: 1
      })
      onClose()
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  const renderElement = (element: CanvasElement) => {
    const commonProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      fill: element.fill,
      stroke: element.stroke,
      strokeWidth: element.strokeWidth,
      opacity: element.opacity || 1,
      rotation: element.rotation || 0,
      scaleX: element.scaleX || 1,
      scaleY: element.scaleY || 1,
      visible: element.visible !== false
    }

    switch (element.type) {
      case 'rect':
        return (
          <Rect
            {...commonProps}
            width={element.width || 100}
            height={element.height || 100}
            cornerRadius={element.borderRadius || 0}
          />
        )
      
      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={element.radius || 50}
          />
        )
      
      case 'text':
        return (
          <Text
            {...commonProps}
            text={element.text || 'Text'}
            fontSize={element.fontSize || 16}
            fontFamily={element.fontFamily || 'Arial'}
            fontStyle={element.fontWeight === 'bold' ? 'bold' : 'normal'}
            width={element.width || 200}
            height={element.height || 40}
            align="center"
            verticalAlign="middle"
          />
        )
      
      case 'image':
        const cachedImage = imageCache.get(element.src!)
        return (
          <Image
            {...commonProps}
            image={cachedImage}
            width={element.width || 200}
            height={element.height || 150}
            cornerRadius={element.borderRadius || 0}
          />
        )
      
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Download Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Preview Canvas */}
          <div className="flex justify-center">
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-lg">
              <Stage
                width={Math.min(canvasSize.width, 600)}
                height={Math.min(canvasSize.height, 400)}
                ref={stageRef}
                scaleX={Math.min(600 / canvasSize.width, 400 / canvasSize.height)}
                scaleY={Math.min(600 / canvasSize.width, 400 / canvasSize.height)}
              >
                <Layer>
                  {/* Background */}
                  <Rect
                    x={0}
                    y={0}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    fill="#ffffff"
                  />
                  
                  {/* Elements */}
                  {elements.map(element => renderElement(element))}
                </Layer>
              </Stage>
            </div>
          </div>

          {/* Preview Image */}
          {previewDataUrl && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Preview (2x resolution):</p>
              <img
                src={previewDataUrl}
                alt="Download preview"
                className="max-w-full max-h-64 mx-auto border border-gray-200 rounded"
              />
            </div>
          )}

          {/* Download Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Design Name:</span>
                <span className="ml-2 text-gray-900">{designName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Canvas Size:</span>
                <span className="ml-2 text-gray-900">{canvasSize.width} × {canvasSize.height}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Export Size:</span>
                <span className="ml-2 text-gray-900">{canvasSize.width * 2} × {canvasSize.height * 2}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Format:</span>
                <span className="ml-2 text-gray-900">PNG (High Quality)</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DownloadPreviewModal
