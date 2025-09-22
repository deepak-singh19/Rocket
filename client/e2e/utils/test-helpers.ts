import { Page, expect } from '@playwright/test'

export class CanvasTestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the canvas to be ready
   */
  async waitForCanvasReady() {
    await this.page.waitForSelector('[data-testid="canvas-stage"]', { timeout: 10000 })
    await this.page.waitForFunction(() => {
      const canvas = document.querySelector('[data-testid="canvas-stage"]')
      return canvas && canvas.children.length > 0
    })
  }

  /**
   * Add a text element to the canvas
   */
  async addTextElement(text: string = 'Test Text') {
    // Click Add Text button
    await this.page.click('[data-testid="add-text-btn"]')
    
    // Wait for text element to be added
    await this.page.waitForSelector('[data-testid="canvas-element"]', { timeout: 5000 })
    
    // Double click to edit text
    const textElement = this.page.locator('[data-testid="canvas-element"]').first()
    await textElement.dblclick()
    
    // Type new text
    await this.page.keyboard.type(text)
    await this.page.keyboard.press('Escape')
  }

  /**
   * Add a rectangle element to the canvas
   */
  async addRectElement() {
    await this.page.click('[data-testid="add-rect-btn"]')
    await this.page.waitForSelector('[data-testid="canvas-element"]', { timeout: 5000 })
  }

  /**
   * Add a circle element to the canvas
   */
  async addCircleElement() {
    await this.page.click('[data-testid="add-circle-btn"]')
    await this.page.waitForSelector('[data-testid="canvas-element"]', { timeout: 5000 })
  }

  /**
   * Add an image element to the canvas
   */
  async addImageElement(imageUrl: string = 'https://via.placeholder.com/300x200') {
    await this.page.click('[data-testid="add-image-btn"]')
    
    // Wait for image URL modal
    await this.page.waitForSelector('[data-testid="image-url-modal"]', { timeout: 5000 })
    
    // Enter image URL
    await this.page.fill('[data-testid="image-url-input"]', imageUrl)
    await this.page.click('[data-testid="add-image-confirm"]')
    
    // Wait for image element to be added
    await this.page.waitForSelector('[data-testid="canvas-element"]', { timeout: 10000 })
  }

  /**
   * Select an element on the canvas
   */
  async selectElement(index: number = 0) {
    const elements = this.page.locator('[data-testid="canvas-element"]')
    await elements.nth(index).click()
    
    // Wait for selection indicator
    await this.page.waitForSelector('[data-testid="selection-indicator"]', { timeout: 5000 })
  }

  /**
   * Move an element by dragging
   */
  async moveElement(elementIndex: number = 0, deltaX: number = 100, deltaY: number = 100) {
    const element = this.page.locator('[data-testid="canvas-element"]').nth(elementIndex)
    
    // Get element position
    const box = await element.boundingBox()
    if (!box) throw new Error('Element not found')
    
    // Drag element
    await element.dragTo(element, {
      targetPosition: { x: box.x + deltaX, y: box.y + deltaY }
    })
  }

  /**
   * Resize an element
   */
  async resizeElement(elementIndex: number = 0, deltaWidth: number = 50, deltaHeight: number = 50) {
    const element = this.page.locator('[data-testid="canvas-element"]').nth(elementIndex)
    await element.click()
    
    // Wait for resize handles
    await this.page.waitForSelector('[data-testid="resize-handle"]', { timeout: 5000 })
    
    const resizeHandle = this.page.locator('[data-testid="resize-handle"]').first()
    const box = await resizeHandle.boundingBox()
    if (!box) throw new Error('Resize handle not found')
    
    await resizeHandle.dragTo(resizeHandle, {
      targetPosition: { x: box.x + deltaWidth, y: box.y + deltaHeight }
    })
  }

  /**
   * Perform undo operation
   */
  async undo() {
    await this.page.click('[data-testid="undo-btn"]')
    await this.page.waitForTimeout(500) // Wait for undo to complete
  }

  /**
   * Perform redo operation
   */
  async redo() {
    await this.page.click('[data-testid="redo-btn"]')
    await this.page.waitForTimeout(500) // Wait for redo to complete
  }

  /**
   * Move element to front (bring forward)
   */
  async moveElementToFront(elementIndex: number = 0) {
    await this.selectElement(elementIndex)
    await this.page.click('[data-testid="move-to-front-btn"]')
  }

  /**
   * Move element to back (send backward)
   */
  async moveElementToBack(elementIndex: number = 0) {
    await this.selectElement(elementIndex)
    await this.page.click('[data-testid="move-to-back-btn"]')
  }

  /**
   * Rename an element
   */
  async renameElement(elementIndex: number = 0, newName: string) {
    // Open layers panel
    await this.page.click('[data-testid="layers-panel-btn"]')
    
    // Click rename button for the element
    const layerItem = this.page.locator('[data-testid="layer-item"]').nth(elementIndex)
    await layerItem.hover()
    await layerItem.locator('[data-testid="rename-btn"]').click()
    
    // Enter new name
    await this.page.fill('[data-testid="rename-input"]', newName)
    await this.page.keyboard.press('Enter')
  }

  /**
   * Delete an element
   */
  async deleteElement(elementIndex: number = 0) {
    await this.selectElement(elementIndex)
    await this.page.keyboard.press('Delete')
  }

  /**
   * Export canvas as PNG
   */
  async exportCanvas(): Promise<string> {
    await this.page.click('[data-testid="download-btn"]')
    
    // Wait for download modal
    await this.page.waitForSelector('[data-testid="download-modal"]', { timeout: 5000 })
    
    // Wait for preview to load
    await this.page.waitForSelector('[data-testid="download-preview"]', { timeout: 10000 })
    
    // Get the data URL from the preview image
    const dataUrl = await this.page.evaluate(() => {
      const img = document.querySelector('[data-testid="download-preview"]') as HTMLImageElement
      return img?.src || ''
    })
    
    return dataUrl
  }

  /**
   * Get the number of elements on the canvas
   */
  async getElementCount(): Promise<number> {
    const elements = this.page.locator('[data-testid="canvas-element"]')
    return await elements.count()
  }

  /**
   * Get element properties from the properties panel
   */
  async getElementProperties() {
    await this.page.waitForSelector('[data-testid="properties-panel"]', { timeout: 5000 })
    
    return await this.page.evaluate(() => {
      const panel = document.querySelector('[data-testid="properties-panel"]')
      if (!panel) return null
      
      const inputs = panel.querySelectorAll('input')
      const properties: Record<string, string> = {}
      
      inputs.forEach(input => {
        const label = input.previousElementSibling?.textContent || input.name
        properties[label] = input.value
      })
      
      return properties
    })
  }

  /**
   * Wait for collaboration connection
   */
  async waitForCollaborationConnection() {
    await this.page.waitForSelector('[data-testid="collaboration-indicator"]', { timeout: 10000 })
    await this.page.waitForFunction(() => {
      const indicator = document.querySelector('[data-testid="collaboration-indicator"]')
      return indicator?.textContent?.includes('Connected')
    })
  }

  /**
   * Get collaboration users
   */
  async getCollaborationUsers(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const users = document.querySelectorAll('[data-testid="collaboration-user"]')
      return Array.from(users).map(user => user.textContent || '')
    })
  }

  /**
   * Wait for element to appear in another browser context
   */
  async waitForElementInOtherContext(otherPage: any, elementCount: number) {
    await otherPage.waitForFunction((count: number) => {
      const elements = document.querySelectorAll('[data-testid="canvas-element"]')
      return elements.length >= count
    }, elementCount, { timeout: 10000 })
  }

  /**
   * Create a new design
   */
  async createNewDesign(name: string = 'E2E Test Design') {
    await this.page.click('[data-testid="new-design-btn"]')
    
    // Wait for new design page
    await this.page.waitForURL('**/design/new', { timeout: 10000 })
    
    // Wait for canvas to be ready
    await this.waitForCanvasReady()
  }

  /**
   * Save design
   */
  async saveDesign() {
    await this.page.click('[data-testid="save-btn"]')
    
    // Wait for save success toast
    await this.page.waitForSelector('[data-testid="toast-success"]', { timeout: 10000 })
  }

  /**
   * Get design ID from URL
   */
  async getDesignId(): Promise<string> {
    const url = this.page.url()
    const match = url.match(/\/design\/([a-f0-9]{24})/)
    if (!match) throw new Error('Design ID not found in URL')
    return match[1]
  }
}
