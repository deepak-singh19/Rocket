import { test, expect } from '@playwright/test'
import { CanvasTestHelpers } from './utils/test-helpers'

test.describe('Design Creation and Editing', () => {
  let helpers: CanvasTestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new CanvasTestHelpers(page)
    
    // Navigate to new design page
    await page.goto('/design/new')
    await helpers.waitForCanvasReady()
  })

  test('should create a new design and add elements', async ({ page }) => {
    // Add text element
    await helpers.addTextElement('Hello World')
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(1)

    // Add rectangle element
    await helpers.addRectElement()
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(2)

    // Add circle element
    await helpers.addCircleElement()
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(3)

    // Add image element
    await helpers.addImageElement('https://via.placeholder.com/300x200')
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(4)

    // Verify all elements are visible
    const elements = page.locator('[data-testid="canvas-element"]')
    await expect(elements).toHaveCount(4)
  })

  test('should edit text element', async ({ page }) => {
    // Add text element
    await helpers.addTextElement('Original Text')
    
    // Select and edit text
    await helpers.selectElement(0)
    const textElement = page.locator('[data-testid="canvas-element"]').first()
    await textElement.dblclick()
    
    // Clear and type new text
    await page.keyboard.press('Control+a')
    await page.keyboard.type('Edited Text')
    await page.keyboard.press('Escape')
    
    // Verify text was updated
    await expect(textElement).toContainText('Edited Text')
  })

  test('should move and resize elements', async ({ page }) => {
    // Add rectangle element
    await helpers.addRectElement()
    
    // Select element
    await helpers.selectElement(0)
    
    // Move element
    await helpers.moveElement(0, 100, 100)
    
    // Resize element
    await helpers.resizeElement(0, 50, 50)
    
    // Verify element is still selected
    await expect(page.locator('[data-testid="selection-indicator"]')).toBeVisible()
  })

  test('should reorder layers', async ({ page }) => {
    // Add multiple elements
    await helpers.addTextElement('Text 1')
    await helpers.addRectElement()
    await helpers.addCircleElement()
    
    // Open layers panel
    await page.click('[data-testid="layers-panel-btn"]')
    
    // Verify initial order
    const layerItems = page.locator('[data-testid="layer-item"]')
    await expect(layerItems).toHaveCount(3)
    
    // Move first element to front
    await helpers.moveElementToFront(0)
    
    // Move last element to back
    await helpers.moveElementToBack(2)
    
    // Verify elements are still visible
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(3)
  })

  test('should rename elements in layers panel', async ({ page }) => {
    // Add text element
    await helpers.addTextElement('Test Text')
    
    // Open layers panel
    await page.click('[data-testid="layers-panel-btn"]')
    
    // Rename element
    await helpers.renameElement(0, 'Renamed Element')
    
    // Verify rename
    const layerItem = page.locator('[data-testid="layer-item"]').first()
    await expect(layerItem).toContainText('Renamed Element')
  })

  test('should delete elements', async ({ page }) => {
    // Add multiple elements
    await helpers.addTextElement('Text 1')
    await helpers.addRectElement()
    await helpers.addCircleElement()
    
    // Verify initial count
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(3)
    
    // Delete first element
    await helpers.deleteElement(0)
    
    // Verify element was deleted
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(2)
  })

  test('should perform undo and redo operations', async ({ page }) => {
    // Add text element
    await helpers.addTextElement('Original Text')
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(1)
    
    // Add rectangle element
    await helpers.addRectElement()
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(2)
    
    // Undo last action
    await helpers.undo()
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(1)
    
    // Undo again
    await helpers.undo()
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(0)
    
    // Redo
    await helpers.redo()
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(1)
    
    // Redo again
    await helpers.redo()
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(2)
  })

  test('should export canvas as PNG', async ({ page }) => {
    // Add some elements
    await helpers.addTextElement('Export Test')
    await helpers.addRectElement()
    await helpers.addCircleElement()
    
    // Export canvas
    const dataUrl = await helpers.exportCanvas()
    
    // Verify data URL is valid and has sufficient length
    expect(dataUrl).toMatch(/^data:image\/png;base64,/)
    expect(dataUrl.length).toBeGreaterThan(1000)
    
    // Verify it's a valid base64 string
    const base64Data = dataUrl.split(',')[1]
    expect(base64Data).toBeTruthy()
    expect(base64Data.length).toBeGreaterThan(1000)
  })

  test('should save design', async ({ page }) => {
    // Add elements
    await helpers.addTextElement('Saved Design')
    await helpers.addRectElement()
    
    // Save design
    await helpers.saveDesign()
    
    // Verify save success toast
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    
    // Get design ID from URL
    const designId = await helpers.getDesignId()
    expect(designId).toMatch(/^[a-f0-9]{24}$/)
  })

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Add elements
    await helpers.addTextElement('Keyboard Test')
    await helpers.addRectElement()
    await helpers.addCircleElement()
    
    // Test Ctrl+Z (undo)
    await page.keyboard.press('Control+z')
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(2)
    
    // Test Ctrl+Y (redo)
    await page.keyboard.press('Control+y')
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(3)
    
    // Test Delete key
    await helpers.selectElement(0)
    await page.keyboard.press('Delete')
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(2)
  })

  test('should handle element selection and properties', async ({ page }) => {
    // Add rectangle element
    await helpers.addRectElement()
    
    // Select element
    await helpers.selectElement(0)
    
    // Verify selection indicator
    await expect(page.locator('[data-testid="selection-indicator"]')).toBeVisible()
    
    // Open properties panel
    await page.click('[data-testid="properties-panel-btn"]')
    
    // Verify properties panel is visible
    await expect(page.locator('[data-testid="properties-panel"]')).toBeVisible()
    
    // Get element properties
    const properties = await helpers.getElementProperties()
    expect(properties).toBeTruthy()
  })

  test('should handle canvas interactions', async ({ page }) => {
    // Add elements
    await helpers.addTextElement('Interaction Test')
    await helpers.addRectElement()
    
    // Click on canvas to deselect
    await page.click('[data-testid="canvas-stage"]', { position: { x: 50, y: 50 } })
    
    // Verify no element is selected
    await expect(page.locator('[data-testid="selection-indicator"]')).not.toBeVisible()
    
    // Select element by clicking
    await helpers.selectElement(0)
    await expect(page.locator('[data-testid="selection-indicator"]')).toBeVisible()
  })

  test('should handle element transformations', async ({ page }) => {
    // Add rectangle element
    await helpers.addRectElement()
    
    // Select element
    await helpers.selectElement(0)
    
    // Rotate element
    await page.click('[data-testid="rotate-btn"]')
    
    // Scale element
    await page.click('[data-testid="scale-btn"]')
    
    // Verify element is still visible and selected
    await expect(page.locator('[data-testid="canvas-element"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="selection-indicator"]')).toBeVisible()
  })
})
