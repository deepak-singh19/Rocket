import { test, expect } from '@playwright/test'
import { CanvasTestHelpers } from './utils/test-helpers'

test.describe('Real-time Collaboration', () => {
  test('should allow multiple users to collaborate on the same design', async ({ browser }) => {
    // Create two browser contexts (simulating two users)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    const helpers1 = new CanvasTestHelpers(page1)
    const helpers2 = new CanvasTestHelpers(page2)
    
    try {
      // User 1: Create a new design
      await page1.goto('/design/new')
      await helpers1.waitForCanvasReady()
      
      // Add initial elements
      await helpers1.addTextElement('User 1 Text')
      await helpers1.addRectElement()
      
      // Save design to get a design ID
      await helpers1.saveDesign()
      const designId = await helpers1.getDesignId()
      
      // User 2: Join the same design
      await page2.goto(`/design/${designId}`)
      await helpers2.waitForCanvasReady()
      
      // Wait for collaboration connection
      await helpers1.waitForCollaborationConnection()
      await helpers2.waitForCollaborationConnection()
      
      // Verify both users are connected
      const users1 = await helpers1.getCollaborationUsers()
      const users2 = await helpers2.getCollaborationUsers()
      
      expect(users1.length).toBeGreaterThanOrEqual(1)
      expect(users2.length).toBeGreaterThanOrEqual(1)
      
      // User 1: Add a new element
      await helpers1.addCircleElement()
      
      // User 2: Should see the new element
      await helpers2.waitForElementInOtherContext(page2, 3)
      await expect(page2.locator('[data-testid="canvas-element"]')).toHaveCount(3)
      
      // User 2: Add another element
      await helpers2.addImageElement('https://via.placeholder.com/200x150')
      
      // User 1: Should see the new element
      await helpers1.waitForElementInOtherContext(page1, 4)
      await expect(page1.locator('[data-testid="canvas-element"]')).toHaveCount(4)
      
      // User 1: Edit an existing element
      await helpers1.selectElement(0)
      const textElement1 = page1.locator('[data-testid="canvas-element"]').first()
      await textElement1.dblclick()
      await page1.keyboard.press('Control+a')
      await page1.keyboard.type('Edited by User 1')
      await page1.keyboard.press('Escape')
      
      // User 2: Should see the edited text
      await page2.waitForFunction(() => {
        const textElement = document.querySelector('[data-testid="canvas-element"]') as HTMLElement
        return textElement?.textContent?.includes('Edited by User 1')
      }, { timeout: 10000 })
      
      // User 2: Move an element
      await helpers2.selectElement(1)
      await helpers2.moveElement(1, 50, 50)
      
      // User 1: Should see the moved element
      await page1.waitForTimeout(1000) // Wait for movement to propagate
      
      // User 1: Delete an element
      await helpers1.selectElement(2)
      await helpers1.deleteElement(2)
      
      // User 2: Should see the element was deleted
      await helpers2.waitForElementInOtherContext(page2, 3)
      await expect(page2.locator('[data-testid="canvas-element"]')).toHaveCount(3)
      
      // User 2: Perform undo
      await helpers2.undo()
      
      // User 1: Should see the element was restored
      await helpers1.waitForElementInOtherContext(page1, 4)
      await expect(page1.locator('[data-testid="canvas-element"]')).toHaveCount(4)
      
    } finally {
      // Clean up
      await context1.close()
      await context2.close()
    }
  })

  test('should handle user presence indicators', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    const helpers1 = new CanvasTestHelpers(page1)
    const helpers2 = new CanvasTestHelpers(page2)
    
    try {
      // User 1: Create design
      await page1.goto('/design/new')
      await helpers1.waitForCanvasReady()
      await helpers1.addTextElement('Presence Test')
      await helpers1.saveDesign()
      const designId = await helpers1.getDesignId()
      
      // User 2: Join design
      await page2.goto(`/design/${designId}`)
      await helpers2.waitForCanvasReady()
      
      // Wait for collaboration
      await helpers1.waitForCollaborationConnection()
      await helpers2.waitForCollaborationConnection()
      
      // User 1: Should see User 2 in presence indicator
      await expect(page1.locator('[data-testid="collaboration-indicator"]')).toBeVisible()
      
      // User 2: Should see User 1 in presence indicator
      await expect(page2.locator('[data-testid="collaboration-indicator"]')).toBeVisible()
      
      // User 1: Move cursor
      await page1.mouse.move(100, 100)
      
      // User 2: Should see User 1's cursor (if implemented)
      // This would require cursor tracking implementation
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should handle concurrent edits gracefully', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    const helpers1 = new CanvasTestHelpers(page1)
    const helpers2 = new CanvasTestHelpers(page2)
    
    try {
      // Both users create design
      await page1.goto('/design/new')
      await helpers1.waitForCanvasReady()
      await helpers1.addTextElement('Concurrent Test')
      await helpers1.saveDesign()
      const designId = await helpers1.getDesignId()
      
      await page2.goto(`/design/${designId}`)
      await helpers2.waitForCanvasReady()
      
      // Wait for collaboration
      await helpers1.waitForCollaborationConnection()
      await helpers2.waitForCollaborationConnection()
      
      // Both users add elements simultaneously
      await Promise.all([
        helpers1.addRectElement(),
        helpers2.addCircleElement()
      ])
      
      // Both should see both elements
      await helpers1.waitForElementInOtherContext(page1, 3)
      await helpers2.waitForElementInOtherContext(page2, 3)
      
      await expect(page1.locator('[data-testid="canvas-element"]')).toHaveCount(3)
      await expect(page2.locator('[data-testid="canvas-element"]')).toHaveCount(3)
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should handle user disconnection and reconnection', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    const helpers1 = new CanvasTestHelpers(page1)
    const helpers2 = new CanvasTestHelpers(page2)
    
    try {
      // Both users join design
      await page1.goto('/design/new')
      await helpers1.waitForCanvasReady()
      await helpers1.addTextElement('Reconnection Test')
      await helpers1.saveDesign()
      const designId = await helpers1.getDesignId()
      
      await page2.goto(`/design/${designId}`)
      await helpers2.waitForCanvasReady()
      
      // Wait for collaboration
      await helpers1.waitForCollaborationConnection()
      await helpers2.waitForCollaborationConnection()
      
      // User 2: Disconnect
      await context2.close()
      
      // User 1: Add element
      await helpers1.addRectElement()
      
      // User 2: Reconnect
      const newContext2 = await browser.newContext()
      const newPage2 = await newContext2.newPage()
      const newHelpers2 = new CanvasTestHelpers(newPage2)
      
      await newPage2.goto(`/design/${designId}`)
      await newHelpers2.waitForCanvasReady()
      
      // User 2: Should see the element added while disconnected
      await expect(newPage2.locator('[data-testid="canvas-element"]')).toHaveCount(2)
      
      await newContext2.close()
      
    } finally {
      await context1.close()
    }
  })

  test('should handle layer reordering in collaboration', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    const helpers1 = new CanvasTestHelpers(page1)
    const helpers2 = new CanvasTestHelpers(page2)
    
    try {
      // Both users join design
      await page1.goto('/design/new')
      await helpers1.waitForCanvasReady()
      await helpers1.addTextElement('Layer Test 1')
      await helpers1.addRectElement()
      await helpers1.addCircleElement()
      await helpers1.saveDesign()
      const designId = await helpers1.getDesignId()
      
      await page2.goto(`/design/${designId}`)
      await helpers2.waitForCanvasReady()
      
      // Wait for collaboration
      await helpers1.waitForCollaborationConnection()
      await helpers2.waitForCollaborationConnection()
      
      // User 1: Reorder layers
      await helpers1.moveElementToFront(0)
      
      // User 2: Should see the reordering
      await page2.waitForTimeout(1000) // Wait for reordering to propagate
      
      // User 2: Reorder layers
      await helpers2.moveElementToBack(2)
      
      // User 1: Should see the reordering
      await page1.waitForTimeout(1000) // Wait for reordering to propagate
      
      // Both should still have 3 elements
      await expect(page1.locator('[data-testid="canvas-element"]')).toHaveCount(3)
      await expect(page2.locator('[data-testid="canvas-element"]')).toHaveCount(3)
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should handle comments in collaboration', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    const helpers1 = new CanvasTestHelpers(page1)
    const helpers2 = new CanvasTestHelpers(page2)
    
    try {
      // Both users join design
      await page1.goto('/design/new')
      await helpers1.waitForCanvasReady()
      await helpers1.addTextElement('Comment Test')
      await helpers1.saveDesign()
      const designId = await helpers1.getDesignId()
      
      await page2.goto(`/design/${designId}`)
      await helpers2.waitForCanvasReady()
      
      // Wait for collaboration
      await helpers1.waitForCollaborationConnection()
      await helpers2.waitForCollaborationConnection()
      
      // User 1: Add a comment
      await page1.click('[data-testid="comments-btn"]')
      await page1.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
      await page1.fill('[data-testid="comment-input"]', 'This is a test comment from User 1')
      await page1.click('[data-testid="add-comment-btn"]')
      
      // User 2: Should see the comment
      await page2.click('[data-testid="comments-btn"]')
      await page2.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
      await expect(page2.locator('[data-testid="comment-item"]')).toContainText('This is a test comment from User 1')
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})
