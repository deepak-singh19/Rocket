import { describe, it, expect } from 'vitest'
import {
  createDesignSchema,
  updateDesignSchema,
  saveDesignSchema,
  addCommentSchema,
  designQuerySchema,
  designParamsSchema,
  canvasElementSchema,
  designElementsSchema
} from '../designValidators'

describe('designValidators', () => {
  describe('canvasElementSchema', () => {
    it('should validate a valid rectangle element', () => {
      const validRect = {
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false
      }

      const result = canvasElementSchema.safeParse(validRect)
      expect(result.success).toBe(true)
    })

    it('should validate a valid text element', () => {
      const validText = {
        id: 'text-1',
        type: 'text',
        x: 50,
        y: 50,
        text: 'Hello World',
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#000000',
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false
      }

      const result = canvasElementSchema.safeParse(validText)
      expect(result.success).toBe(true)
    })

    it('should validate a valid image element', () => {
      const validImage = {
        id: 'image-1',
        type: 'image',
        x: 200,
        y: 200,
        width: 300,
        height: 200,
        src: 'https://example.com/image.jpg',
        opacity: 0.8,
        borderRadius: 10,
        fitMode: 'cover',
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false
      }

      const result = canvasElementSchema.safeParse(validImage)
      expect(result.success).toBe(true)
    })

    it('should validate a valid circle element', () => {
      const validCircle = {
        id: 'circle-1',
        type: 'circle',
        x: 150,
        y: 150,
        radius: 50,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 1,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false
      }

      const result = canvasElementSchema.safeParse(validCircle)
      expect(result.success).toBe(true)
    })

    it('should reject invalid element type', () => {
      const invalidElement = {
        id: 'invalid-1',
        type: 'invalid-type',
        x: 100,
        y: 100
      }

      const result = canvasElementSchema.safeParse(invalidElement)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid element type')
      }
    })

    it('should reject negative width', () => {
      const invalidElement = {
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: -50,
        height: 100
      }

      const result = canvasElementSchema.safeParse(invalidElement)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Width must be positive')
      }
    })

    it('should reject invalid opacity', () => {
      const invalidElement = {
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        opacity: 1.5
      }

      const result = canvasElementSchema.safeParse(invalidElement)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Opacity must be between 0 and 1')
      }
    })

    it('should reject invalid URL for image src', () => {
      const invalidElement = {
        id: 'image-1',
        type: 'image',
        x: 100,
        y: 100,
        src: 'not-a-valid-url'
      }

      const result = canvasElementSchema.safeParse(invalidElement)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Image source must be a valid URL')
      }
    })
  })

  describe('designElementsSchema', () => {
    it('should validate valid design elements structure', () => {
      const validElements = {
        canvas: {
          width: 1080,
          height: 1080,
          backgroundColor: '#ffffff'
        },
        objects: [
          {
            id: 'rect-1',
            type: 'rect',
            x: 100,
            y: 100,
            width: 200,
            height: 150,
            fill: '#ff0000'
          },
          {
            id: 'text-1',
            type: 'text',
            x: 50,
            y: 50,
            text: 'Hello World',
            fontSize: 16
          }
        ]
      }

      const result = designElementsSchema.safeParse(validElements)
      expect(result.success).toBe(true)
    })

    it('should reject negative canvas width', () => {
      const invalidElements = {
        canvas: {
          width: -100,
          height: 1080
        },
        objects: []
      }

      const result = designElementsSchema.safeParse(invalidElements)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Canvas width must be positive')
      }
    })

    it('should reject empty objects array with invalid canvas', () => {
      const invalidElements = {
        canvas: {
          width: 0,
          height: 1080
        },
        objects: []
      }

      const result = designElementsSchema.safeParse(invalidElements)
      expect(result.success).toBe(false)
    })
  })

  describe('createDesignSchema', () => {
    it('should validate valid design creation data', () => {
      const validDesign = {
        name: 'My Design',
        width: 1920,
        height: 1080,
        createdBy: 'user-123',
        elements: {
          canvas: { width: 1920, height: 1080, backgroundColor: '#ffffff' },
          objects: []
        }
      }

      const result = createDesignSchema.safeParse(validDesign)
      expect(result.success).toBe(true)
    })

    it('should validate design creation with default elements', () => {
      const validDesign = {
        name: 'My Design',
        width: 1920,
        height: 1080,
        createdBy: 'user-123'
      }

      const result = createDesignSchema.safeParse(validDesign)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.elements).toBeDefined()
        expect(result.data.elements.canvas.width).toBe(1080)
        expect(result.data.elements.canvas.height).toBe(1080)
      }
    })

    it('should reject empty name', () => {
      const invalidDesign = {
        name: '',
        width: 1920,
        height: 1080,
        createdBy: 'user-123'
      }

      const result = createDesignSchema.safeParse(invalidDesign)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Design name is required')
      }
    })

    it('should reject negative dimensions', () => {
      const invalidDesign = {
        name: 'My Design',
        width: -100,
        height: 1080,
        createdBy: 'user-123'
      }

      const result = createDesignSchema.safeParse(invalidDesign)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Width must be positive')
      }
    })
  })

  describe('updateDesignSchema', () => {
    it('should validate valid design update data', () => {
      const validUpdate = {
        name: 'Updated Design',
        width: 1920,
        height: 1080,
        elements: {
          canvas: { width: 1920, height: 1080, backgroundColor: '#ffffff' },
          objects: []
        }
      }

      const result = updateDesignSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it('should validate partial update', () => {
      const partialUpdate = {
        name: 'New Name'
      }

      const result = updateDesignSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it('should reject empty name in update', () => {
      const invalidUpdate = {
        name: ''
      }

      const result = updateDesignSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Design name cannot be empty')
      }
    })
  })

  describe('saveDesignSchema', () => {
    it('should validate valid save design data', () => {
      const validSave = {
        elements: {
          canvas: { width: 1920, height: 1080, backgroundColor: '#ffffff' },
          objects: [
            {
              id: 'rect-1',
              type: 'rect',
              x: 100,
              y: 100,
              width: 200,
              height: 150,
              fill: '#ff0000'
            }
          ]
        },
        layers: [
          { name: 'Layer 1', order: 0 },
          { name: 'Layer 2', order: 1 }
        ],
        thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      }

      const result = saveDesignSchema.safeParse(validSave)
      expect(result.success).toBe(true)
    })

    it('should validate save design without optional fields', () => {
      const validSave = {
        elements: {
          canvas: { width: 1920, height: 1080, backgroundColor: '#ffffff' },
          objects: []
        }
      }

      const result = saveDesignSchema.safeParse(validSave)
      expect(result.success).toBe(true)
    })

    it('should reject save design without elements', () => {
      const invalidSave = {
        layers: []
      }

      const result = saveDesignSchema.safeParse(invalidSave)
      expect(result.success).toBe(false)
    })
  })

  describe('addCommentSchema', () => {
    it('should validate valid comment data', () => {
      const validComment = {
        author: 'John Doe',
        text: 'This is a great design!',
        mentions: ['user-1', 'user-2'],
        elementId: 'element-123'
      }

      const result = addCommentSchema.safeParse(validComment)
      expect(result.success).toBe(true)
    })

    it('should validate comment without elementId', () => {
      const validComment = {
        author: 'John Doe',
        text: 'This is a great design!',
        mentions: []
      }

      const result = addCommentSchema.safeParse(validComment)
      expect(result.success).toBe(true)
    })

    it('should reject empty comment text', () => {
      const invalidComment = {
        author: 'John Doe',
        text: '',
        mentions: []
      }

      const result = addCommentSchema.safeParse(invalidComment)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Comment text is required')
      }
    })

    it('should reject comment text that is too long', () => {
      const longText = 'a'.repeat(1001)
      const invalidComment = {
        author: 'John Doe',
        text: longText,
        mentions: []
      }

      const result = addCommentSchema.safeParse(invalidComment)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Comment text must be less than 1000 characters')
      }
    })

    it('should reject empty author', () => {
      const invalidComment = {
        author: '',
        text: 'This is a comment',
        mentions: []
      }

      const result = addCommentSchema.safeParse(invalidComment)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Author name is required')
      }
    })
  })

  describe('designQuerySchema', () => {
    it('should validate valid query parameters', () => {
      const validQuery = {
        page: '1',
        limit: '10',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        search: 'design'
      }

      const result = designQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should validate query with default values', () => {
      const emptyQuery = {}

      const result = designQuerySchema.safeParse(emptyQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(10)
        expect(result.data.sortBy).toBe('createdAt')
        expect(result.data.sortOrder).toBe('desc')
      }
    })

    it('should reject invalid page number', () => {
      const invalidQuery = {
        page: '0'
      }

      const result = designQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Page must be at least 1')
      }
    })

    it('should reject invalid limit', () => {
      const invalidQuery = {
        limit: '101'
      }

      const result = designQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Limit must be between 1 and 100')
      }
    })

    it('should reject invalid sort order', () => {
      const invalidQuery = {
        sortOrder: 'invalid'
      }

      const result = designQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Sort order must be "asc" or "desc"')
      }
    })
  })

  describe('designParamsSchema', () => {
    it('should validate valid MongoDB ObjectId', () => {
      const validParams = {
        id: '507f1f77bcf86cd799439011'
      }

      const result = designParamsSchema.safeParse(validParams)
      expect(result.success).toBe(true)
    })

    it('should reject invalid ObjectId format', () => {
      const invalidParams = {
        id: 'invalid-id'
      }

      const result = designParamsSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid design ID format')
      }
    })

    it('should reject empty id', () => {
      const invalidParams = {
        id: ''
      }

      const result = designParamsSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Design ID is required')
      }
    })
  })
})
