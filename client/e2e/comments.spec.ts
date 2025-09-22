import { test, expect } from '@playwright/test'
import { CanvasTestHelpers } from './utils/test-helpers'

test.describe('Comments System', () => {
  let helpers: CanvasTestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new CanvasTestHelpers(page)
    
    // Navigate to new design page
    await page.goto('/design/new')
    await helpers.waitForCanvasReady()
  })

  test('should add global comments', async ({ page }) => {
    // Add some elements
    await helpers.addTextElement('Comment Test')
    await helpers.addRectElement()
    
    // Open comments panel
    await page.click('[data-testid="comments-btn"]')
    await page.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
    
    // Add a comment
    await page.fill('[data-testid="comment-input"]', 'This is a global comment')
    await page.click('[data-testid="add-comment-btn"]')
    
    // Verify comment was added
    await expect(page.locator('[data-testid="comment-item"]')).toContainText('This is a global comment')
    await expect(page.locator('[data-testid="comment-item"]')).toContainText('Current User')
  })

  test('should add element-specific comments', async ({ page }) => {
    // Add elements
    await helpers.addTextElement('Element Comment Test')
    await helpers.addRectElement()
    
    // Select first element
    await helpers.selectElement(0)
    
    // Open comments panel
    await page.click('[data-testid="comments-btn"]')
    await page.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
    
    // Verify it shows element comments
    await expect(page.locator('[data-testid="comments-panel"]')).toContainText('Element Comments')
    
    // Add a comment
    await page.fill('[data-testid="comment-input"]', 'This comment is for the text element')
    await page.click('[data-testid="add-comment-btn"]')
    
    // Verify comment was added
    await expect(page.locator('[data-testid="comment-item"]')).toContainText('This comment is for the text element')
  })

  test('should handle @mentions in comments', async ({ page }) => {
    // Add elements
    await helpers.addTextElement('Mention Test')
    
    // Open comments panel
    await page.click('[data-testid="comments-btn"]')
    await page.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
    
    // Type comment with @mention
    await page.fill('[data-testid="comment-input"]', 'Hey @john, what do you think?')
    
    // Verify mention is highlighted
    await expect(page.locator('[data-testid="comment-input"]')).toHaveValue('Hey @john, what do you think?')
    
    // Add comment
    await page.click('[data-testid="add-comment-btn"]')
    
    // Verify comment with mention was added
    await expect(page.locator('[data-testid="comment-item"]')).toContainText('Hey @john, what do you think?')
    
    // Verify mention is highlighted in the comment
    await expect(page.locator('[data-testid="comment-item"] [data-testid="mention"]')).toContainText('@john')
  })

  test('should delete comments', async ({ page }) => {
    // Add elements
    await helpers.addTextElement('Delete Comment Test')
    
    // Open comments panel
    await page.click('[data-testid="comments-btn"]')
    await page.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
    
    // Add a comment
    await page.fill('[data-testid="comment-input"]', 'This comment will be deleted')
    await page.click('[data-testid="add-comment-btn"]')
    
    // Verify comment was added
    await expect(page.locator('[data-testid="comment-item"]')).toContainText('This comment will be deleted')
    
    // Delete comment
    await page.click('[data-testid="delete-comment-btn"]')
    
    // Verify comment was deleted
    await expect(page.locator('[data-testid="comment-item"]')).not.toBeVisible()
  })

  test('should show comment count on elements', async ({ page }) => {
    // Add elements
    await helpers.addTextElement('Comment Count Test')
    await helpers.addRectElement()
    
    // Select first element
    await helpers.selectElement(0)
    
    // Open comments panel
    await page.click('[data-testid="comments-btn"]')
    await page.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
    
    // Add a comment
    await page.fill('[data-testid="comment-input"]', 'First comment')
    await page.click('[data-testid="add-comment-btn"]')
    
    // Add another comment
    await page.fill('[data-testid="comment-input"]', 'Second comment')
    await page.click('[data-testid="add-comment-btn"]')
    
    // Close comments panel
    await page.click('[data-testid="close-comments-btn"]')
    
    // Verify comment count is shown on the element
    await expect(page.locator('[data-testid="comment-count"]')).toContainText('2')
  })

  test('should filter comments by element', async ({ page }) => {
    // Add elements
    await helpers.addTextElement('Element 1')
    await helpers.addRectElement()
    
    // Add comment to first element
    await helpers.selectElement(0)
    await page.click('[data-testid="comments-btn"]')
    await page.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
    await page.fill('[data-testid="comment-input"]', 'Comment for element 1')
    await page.click('[data-testid="add-comment-btn"]')
    
    // Close comments panel
    await page.click('[data-testid="close-comments-btn"]')
    
    // Add comment to second element
    await helpers.selectElement(1)
    await page.click('[data-testid="comments-btn"]')
    await page.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
    await page.fill('[data-testid="comment-input"]', 'Comment for element 2')
    await page.click('[data-testid="add-comment-btn"]')
    
    // Verify only element 2 comment is visible
    await expect(page.locator('[data-testid="comment-item"]')).toContainText('Comment for element 2')
    await expect(page.locator('[data-testid="comment-item"]')).not.toContainText('Comment for element 1')
  })

  test('should handle empty comments', async ({ page }) => {
    // Add elements
    await helpers.addTextElement('Empty Comment Test')
    
    // Open comments panel
    await page.click('[data-testid="comments-btn"]')
    await page.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
    
    // Try to add empty comment
    await page.click('[data-testid="add-comment-btn"]')
    
    // Verify no comment was added
    await expect(page.locator('[data-testid="comment-item"]')).not.toBeVisible()
    
    // Try to add comment with only whitespace
    await page.fill('[data-testid="comment-input"]', '   ')
    await page.click('[data-testid="add-comment-btn"]')
    
    // Verify no comment was added
    await expect(page.locator('[data-testid="comment-item"]')).not.toBeVisible()
  })

  test('should handle long comments', async ({ page }) => {
    // Add elements
    await helpers.addTextElement('Long Comment Test')
    
    // Open comments panel
    await page.click('[data-testid="comments-btn"]')
    await page.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
    
    // Create a long comment
    const longComment = 'This is a very long comment that should be handled properly by the system. '.repeat(20)
    
    // Type the long comment
    await page.fill('[data-testid="comment-input"]', longComment)
    
    // Add comment
    await page.click('[data-testid="add-comment-btn"]')
    
    // Verify comment was added
    await expect(page.locator('[data-testid="comment-item"]')).toContainText(longComment.substring(0, 50))
  })

  test('should show comment timestamps', async ({ page }) => {
    // Add elements
    await helpers.addTextElement('Timestamp Test')
    
    // Open comments panel
    await page.click('[data-testid="comments-btn"]')
    await page.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
    
    // Add a comment
    await page.fill('[data-testid="comment-input"]', 'Comment with timestamp')
    await page.click('[data-testid="add-comment-btn"]')
    
    // Verify timestamp is shown
    await expect(page.locator('[data-testid="comment-timestamp"]')).toBeVisible()
    
    // Verify timestamp format (should contain date/time)
    const timestamp = await page.locator('[data-testid="comment-timestamp"]').textContent()
    expect(timestamp).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/) // Date format
  })

  test('should handle comment input validation', async ({ page }) => {
    // Add elements
    await helpers.addTextElement('Validation Test')
    
    // Open comments panel
    await page.click('[data-testid="comments-btn"]')
    await page.waitForSelector('[data-testid="comments-panel"]', { timeout: 5000 })
    
    // Test input with special characters
    await page.fill('[data-testid="comment-input"]', 'Comment with special chars: !@#$%^&*()')
    await page.click('[data-testid="add-comment-btn"]')
    
    // Verify comment was added
    await expect(page.locator('[data-testid="comment-item"]')).toContainText('Comment with special chars: !@#$%^&*()')
    
    // Test input with emojis
    await page.fill('[data-testid="comment-input"]', 'Comment with emojis 🎨✨🚀')
    await page.click('[data-testid="add-comment-btn"]')
    
    // Verify comment was added
    await expect(page.locator('[data-testid="comment-item"]')).toContainText('Comment with emojis 🎨✨🚀')
  })
})
