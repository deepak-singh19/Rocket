import { Canvas } from '../types/canvas.js'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export class CanvasService {
  private dataDir: string

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data')
    this.ensureDataDirectory()
  }

  private async ensureDataDirectory(): Promise<void> {
    if (!existsSync(this.dataDir)) {
      await mkdir(this.dataDir, { recursive: true })
    }
  }

  private getCanvasFilePath(id: string): string {
    return path.join(this.dataDir, `canvas-${id}.json`)
  }

  async getAllCanvases(): Promise<Canvas[]> {
    try {
      const files = await import('fs').then(fs => fs.promises.readdir(this.dataDir))
      const canvasFiles = files.filter(file => file.startsWith('canvas-') && file.endsWith('.json'))
      
      const canvases: Canvas[] = []
      
      for (const file of canvasFiles) {
        try {
          const filePath = path.join(this.dataDir, file)
          const data = await readFile(filePath, 'utf-8')
          const canvas = JSON.parse(data) as Canvas
          canvases.push(canvas)
        } catch (error) {
          console.error(`Error reading canvas file ${file}:`, error)
        }
      }

      return canvases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error('Error reading canvas files:', error)
      return []
    }
  }

  async getCanvasById(id: string): Promise<Canvas | null> {
    try {
      const filePath = this.getCanvasFilePath(id)
      
      if (!existsSync(filePath)) {
        return null
      }

      const data = await readFile(filePath, 'utf-8')
      return JSON.parse(data) as Canvas
    } catch (error) {
      console.error(`Error reading canvas ${id}:`, error)
      return null
    }
  }

  async createCanvas(canvas: Canvas): Promise<Canvas> {
    try {
      const filePath = this.getCanvasFilePath(canvas.id)
      await writeFile(filePath, JSON.stringify(canvas, null, 2))
      return canvas
    } catch (error) {
      console.error(`Error creating canvas ${canvas.id}:`, error)
      throw new Error('Failed to create canvas')
    }
  }

  async updateCanvas(id: string, updates: Partial<Canvas>): Promise<Canvas | null> {
    try {
      const existingCanvas = await this.getCanvasById(id)
      
      if (!existingCanvas) {
        return null
      }

      const updatedCanvas: Canvas = {
        ...existingCanvas,
        ...updates,
        id: existingCanvas.id, // Ensure ID doesn't change
        createdAt: existingCanvas.createdAt // Ensure createdAt doesn't change
      }

      const filePath = this.getCanvasFilePath(id)
      await writeFile(filePath, JSON.stringify(updatedCanvas, null, 2))
      
      return updatedCanvas
    } catch (error) {
      console.error(`Error updating canvas ${id}:`, error)
      throw new Error('Failed to update canvas')
    }
  }

  async deleteCanvas(id: string): Promise<boolean> {
    try {
      const filePath = this.getCanvasFilePath(id)
      
      if (!existsSync(filePath)) {
        return false
      }

      await import('fs').then(fs => fs.promises.unlink(filePath))
      return true
    } catch (error) {
      console.error(`Error deleting canvas ${id}:`, error)
      throw new Error('Failed to delete canvas')
    }
  }

  async exportCanvas(id: string, format: string): Promise<any> {
    try {
      const canvas = await this.getCanvasById(id)
      
      if (!canvas) {
        throw new Error('Canvas not found')
      }

      switch (format.toLowerCase()) {
        case 'json':
          return {
            canvas,
            exportedAt: new Date().toISOString(),
            format: 'json'
          }
        
        case 'svg':
          // In a real implementation, you would convert canvas data to SVG
          return {
            svg: `<svg width="${canvas.canvasData.width || 800}" height="${canvas.canvasData.height || 600}">
              <!-- SVG representation of canvas elements would go here -->
            </svg>`,
            exportedAt: new Date().toISOString(),
            format: 'svg'
          }
        
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      console.error(`Error exporting canvas ${id}:`, error)
      throw new Error('Failed to export canvas')
    }
  }

  async saveCanvasImage(id: string, imageData: string, format: string): Promise<{ id: string; filename: string }> {
    try {
      const canvas = await this.getCanvasById(id)
      
      if (!canvas) {
        throw new Error('Canvas not found')
      }

      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      
      const filename = `canvas-${id}-${Date.now()}.${format}`
      const filePath = path.join(this.dataDir, filename)
      
      await writeFile(filePath, buffer)
      
      return {
        id,
        filename
      }
    } catch (error) {
      console.error(`Error saving canvas image ${id}:`, error)
      throw new Error('Failed to save canvas image')
    }
  }
}
