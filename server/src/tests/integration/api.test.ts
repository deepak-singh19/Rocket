import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../../index.js'
import { User } from '../../models/User.js'
import { Design } from '../../models/Design.js'

describe('API Integration Tests', () => {
  let mongoServer: MongoMemoryServer
  let accessToken: string
  let userId: string

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri)

    // Create test user
    const user = new User({
      email: 'integration@test.com',
      password: 'IntegrationTest123!',
      name: 'Integration Test User'
    })
    await user.save()
    userId = user._id.toString()

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'integration@test.com',
        password: 'IntegrationTest123!'
      })

    accessToken = loginResponse.body.data.tokens.accessToken
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // Test login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration@test.com',
          password: 'IntegrationTest123!'
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)
      expect(loginResponse.body.data.tokens.accessToken).toBeDefined()

      // Test protected endpoint
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(profileResponse.body.data.user.email).toBe('integration@test.com')
    })
  })

  describe('Design CRUD Operations', () => {
    let designId: string

    it('should create a design', async () => {
      const designData = {
        name: 'Integration Test Design',
        width: 800,
        height: 600
      }

      const response = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(designData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(designData.name)
      expect(response.body.data.createdBy).toBe(userId)
      
      designId = response.body.data._id
    })

    it('should retrieve the design', async () => {
      const response = await request(app)
        .get(`/api/designs/${designId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.data._id).toBe(designId)
      expect(response.body.data.name).toBe('Integration Test Design')
    })

    it('should update the design', async () => {
      const updateData = {
        name: 'Updated Integration Test Design',
        width: 1024,
        height: 768
      }

      const response = await request(app)
        .put(`/api/designs/${designId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.width).toBe(updateData.width)
    })

    it('should save design content', async () => {
      const saveData = {
        elements: [
          {
            id: 'test-element-1',
            type: 'text',
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            content: 'Test Text'
          }
        ],
        layers: ['test-element-1']
      }

      const response = await request(app)
        .put(`/api/designs/${designId}/save`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(saveData)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should add a comment', async () => {
      const commentData = {
        text: 'This is a test comment',
        mentions: []
      }

      const response = await request(app)
        .post(`/api/designs/${designId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.comment.text).toBe(commentData.text)
    })

    it('should delete the design', async () => {
      const response = await request(app)
        .delete(`/api/designs/${designId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid design ID', async () => {
      const response = await request(app)
        .get('/api/designs/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400)

      expect(response.body.code).toBe('INVALID_DESIGN_ID')
    })

    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .post('/api/designs')
        .send({
          name: 'Unauthorized Design',
          width: 800,
          height: 600
        })
        .expect(401)

      expect(response.body.code).toBe('MISSING_TOKEN')
    })
  })
})
