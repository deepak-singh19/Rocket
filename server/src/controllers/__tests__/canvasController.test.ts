import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { canvasController } from '../canvasController'
import Design from '../../models/Design'

// Create test app
const app = express()
app.use(express.json())

// Mock routes for testing
app.get('/api/designs', canvasController.getDesigns)
app.get('/api/designs/:id', canvasController.getDesignById)
app.post('/api/designs', canvasController.createDesign)
app.put('/api/designs/:id', canvasController.updateDesign)
app.delete('/api/designs/:id', canvasController.deleteDesign)
app.get('/api/designs/:id/comments', canvasController.getComments)
app.post('/api/designs/:id/comments', canvasController.addComment)
app.delete('/api/designs/:id/comments/:commentId', canvasController.deleteComment)
app.put('/api/designs/:id/save', canvasController.saveDesign)
app.get('/api/designs/:id/sync', canvasController.syncDesign)

describe('CanvasController', () => {
  let testDesignId: string

  beforeAll(async () => {
    // Create a test design
    const testDesign = new Design({
      name: 'Test Design',
      width: 1080,
      height: 1080,
      createdBy: 'test-user',
      elements: {
        canvas: { width: 1080, height: 1080, backgroundColor: '#ffffff' },
        objects: []
      },
      layers: [],
      comments: []
    })
    
    const savedDesign = await testDesign.save()
    testDesignId = savedDesign._id.toString()
  })

  afterAll(async () => {
    // Clean up test data
    await Design.deleteMany({})
  })

  describe('GET /api/designs', () => {
    it('should get all designs', async () => {
      const response = await request(app)
        .get('/api/designs')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should get designs with pagination', async () => {
      const response = await request(app)
        .get('/api/designs?page=1&limit=5')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.pagination).toBeDefined()
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(5)
    })

    it('should search designs by name', async () => {
      const response = await request(app)
        .get('/api/designs?search=Test')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
    })
  })

  describe('GET /api/designs/:id', () => {
    it('should get design by valid ID', async () => {
      const response = await request(app)
        .get(`/api/designs/${testDesignId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data._id).toBe(testDesignId)
      expect(response.body.data.name).toBe('Test Design')
    })

    it('should return 404 for non-existent design', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const response = await request(app)
        .get(`/api/designs/${fakeId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('DESIGN_NOT_FOUND')
    })

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/designs/invalid-id')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('INVALID_ID')
    })
  })

  describe('POST /api/designs', () => {
    it('should create a new design', async () => {
      const newDesign = {
        name: 'New Test Design',
        width: 1920,
        height: 1080,
        createdBy: 'test-user',
        elements: {
          canvas: { width: 1920, height: 1080, backgroundColor: '#ffffff' },
          objects: []
        }
      }

      const response = await request(app)
        .post('/api/designs')
        .send(newDesign)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('New Test Design')
      expect(response.body.data.width).toBe(1920)
      expect(response.body.data.height).toBe(1080)
    })

    it('should return 400 for invalid design data', async () => {
      const invalidDesign = {
        name: '', // Empty name should fail validation
        width: -100, // Negative width should fail validation
        height: 1080,
        createdBy: 'test-user'
      }

      const response = await request(app)
        .post('/api/designs')
        .send(invalidDesign)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should create design with default elements if not provided', async () => {
      const designWithoutElements = {
        name: 'Design Without Elements',
        width: 1080,
        height: 1080,
        createdBy: 'test-user'
      }

      const response = await request(app)
        .post('/api/designs')
        .send(designWithoutElements)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.elements).toBeDefined()
      expect(response.body.data.elements.canvas.width).toBe(1080)
      expect(response.body.data.elements.canvas.height).toBe(1080)
    })
  })

  describe('PUT /api/designs/:id', () => {
    it('should update an existing design', async () => {
      const updates = {
        name: 'Updated Test Design',
        width: 1920,
        height: 1080
      }

      const response = await request(app)
        .put(`/api/designs/${testDesignId}`)
        .send(updates)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Updated Test Design')
      expect(response.body.data.width).toBe(1920)
      expect(response.body.data.height).toBe(1080)
    })

    it('should return 404 for non-existent design', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const updates = { name: 'Updated Name' }

      const response = await request(app)
        .put(`/api/designs/${fakeId}`)
        .send(updates)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('DESIGN_NOT_FOUND')
    })

    it('should return 400 for invalid update data', async () => {
      const invalidUpdates = {
        name: '', // Empty name should fail validation
        width: -100 // Negative width should fail validation
      }

      const response = await request(app)
        .put(`/api/designs/${testDesignId}`)
        .send(invalidUpdates)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('DELETE /api/designs/:id', () => {
    let designToDeleteId: string

    beforeAll(async () => {
      // Create a design to delete
      const designToDelete = new Design({
        name: 'Design To Delete',
        width: 1080,
        height: 1080,
        createdBy: 'test-user',
        elements: {
          canvas: { width: 1080, height: 1080, backgroundColor: '#ffffff' },
          objects: []
        },
        layers: [],
        comments: []
      })
      
      const savedDesign = await designToDelete.save()
      designToDeleteId = savedDesign._id.toString()
    })

    it('should delete an existing design', async () => {
      const response = await request(app)
        .delete(`/api/designs/${designToDeleteId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Design deleted successfully')
    })

    it('should return 404 for non-existent design', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const response = await request(app)
        .delete(`/api/designs/${fakeId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('DESIGN_NOT_FOUND')
    })
  })

  describe('GET /api/designs/:id/comments', () => {
    it('should get comments for a design', async () => {
      const response = await request(app)
        .get(`/api/designs/${testDesignId}/comments`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
    })

    it('should return 404 for non-existent design', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const response = await request(app)
        .get(`/api/designs/${fakeId}/comments`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('DESIGN_NOT_FOUND')
    })
  })

  describe('POST /api/designs/:id/comments', () => {
    it('should add a comment to a design', async () => {
      const newComment = {
        author: 'Test User',
        text: 'This is a test comment',
        mentions: ['user-1', 'user-2'],
        elementId: 'element-123'
      }

      const response = await request(app)
        .post(`/api/designs/${testDesignId}/comments`)
        .send(newComment)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.comment.text).toBe('This is a test comment')
      expect(response.body.data.comment.author).toBe('Test User')
      expect(response.body.data.comment.mentions).toEqual(['user-1', 'user-2'])
      expect(response.body.data.comment.elementId).toBe('element-123')
    })

    it('should add a global comment without elementId', async () => {
      const globalComment = {
        author: 'Test User',
        text: 'This is a global comment',
        mentions: []
      }

      const response = await request(app)
        .post(`/api/designs/${testDesignId}/comments`)
        .send(globalComment)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.comment.text).toBe('This is a global comment')
      expect(response.body.data.comment.elementId).toBeUndefined()
    })

    it('should return 400 for invalid comment data', async () => {
      const invalidComment = {
        author: '', // Empty author should fail validation
        text: '', // Empty text should fail validation
        mentions: []
      }

      const response = await request(app)
        .post(`/api/designs/${testDesignId}/comments`)
        .send(invalidComment)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 404 for non-existent design', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const comment = {
        author: 'Test User',
        text: 'This is a test comment',
        mentions: []
      }

      const response = await request(app)
        .post(`/api/designs/${fakeId}/comments`)
        .send(comment)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('DESIGN_NOT_FOUND')
    })
  })

  describe('DELETE /api/designs/:id/comments/:commentId', () => {
    let commentToDeleteId: string

    beforeAll(async () => {
      // Add a comment to delete
      const comment = {
        author: 'Test User',
        text: 'Comment to delete',
        mentions: []
      }

      const response = await request(app)
        .post(`/api/designs/${testDesignId}/comments`)
        .send(comment)
        .expect(201)

      commentToDeleteId = response.body.data.comment._id
    })

    it('should delete a comment', async () => {
      const response = await request(app)
        .delete(`/api/designs/${testDesignId}/comments/${commentToDeleteId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Comment deleted successfully')
      expect(response.body.data.commentId).toBe(commentToDeleteId)
    })

    it('should return 404 for non-existent comment', async () => {
      const fakeCommentId = new mongoose.Types.ObjectId().toString()
      const response = await request(app)
        .delete(`/api/designs/${testDesignId}/comments/${fakeCommentId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('DESIGN_NOT_FOUND')
    })

    it('should return 400 for invalid comment ID format', async () => {
      const response = await request(app)
        .delete(`/api/designs/${testDesignId}/comments/invalid-id`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('INVALID_COMMENT_ID')
    })
  })

  describe('PUT /api/designs/:id/save', () => {
    it('should save design content', async () => {
      const saveData = {
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
          { name: 'Layer 1', order: 0 }
        ],
        thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      }

      const response = await request(app)
        .put(`/api/designs/${testDesignId}/save`)
        .send(saveData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Design saved successfully')
      expect(response.body.data.elementsCount).toBe(1)
    })

    it('should return 400 for invalid elements structure', async () => {
      const invalidSaveData = {
        elements: {
          // Missing canvas property
          objects: []
        }
      }

      const response = await request(app)
        .put(`/api/designs/${testDesignId}/save`)
        .send(invalidSaveData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 404 for non-existent design', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const saveData = {
        elements: {
          canvas: { width: 1920, height: 1080, backgroundColor: '#ffffff' },
          objects: []
        }
      }

      const response = await request(app)
        .put(`/api/designs/${fakeId}/save`)
        .send(saveData)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('DESIGN_NOT_FOUND')
    })
  })

  describe('GET /api/designs/:id/sync', () => {
    it('should sync design without client version', async () => {
      const response = await request(app)
        .get(`/api/designs/${testDesignId}/sync`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.designId).toBe(testDesignId)
      expect(response.body.data.version).toBeDefined()
      expect(response.body.data.lastSyncAt).toBeDefined()
      expect(response.body.data.needsFullSync).toBe(true)
      expect(response.body.data.design).toBeDefined()
    })

    it('should sync design with client version', async () => {
      const response = await request(app)
        .get(`/api/designs/${testDesignId}/sync?clientVersion=1`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.designId).toBe(testDesignId)
      expect(response.body.data.version).toBeDefined()
      expect(response.body.data.needsFullSync).toBeDefined()
    })

    it('should return 404 for non-existent design', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const response = await request(app)
        .get(`/api/designs/${fakeId}/sync`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('DESIGN_NOT_FOUND')
    })

    it('should return 400 for invalid design ID format', async () => {
      const response = await request(app)
        .get('/api/designs/invalid-id/sync')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('INVALID_ID')
    })
  })
})
