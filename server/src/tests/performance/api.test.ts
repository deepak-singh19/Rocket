import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../../index.js'
import { User } from '../../models/User.js'
import { Design } from '../../models/Design.js'

describe('API Performance Tests', () => {
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
      email: 'performance@test.com',
      password: 'PerformanceTest123!',
      name: 'Performance Test User'
    })
    await user.save()
    userId = user._id.toString()

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'performance@test.com',
        password: 'PerformanceTest123!'
      })

    accessToken = loginResponse.body.data.tokens.accessToken
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  describe('Authentication Performance', () => {
    it('should login within acceptable time', async () => {
      const startTime = Date.now()
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'performance@test.com',
          password: 'PerformanceTest123!'
        })
        .expect(200)

      const duration = Date.now() - startTime
      
      expect(response.body.success).toBe(true)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second

    })

    it('should validate token within acceptable time', async () => {
      const startTime = Date.now()
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      const duration = Date.now() - startTime
      
      expect(response.body.success).toBe(true)
      expect(duration).toBeLessThan(500) // Should complete within 500ms

    })
  })

  describe('Design Operations Performance', () => {
    it('should create design within acceptable time', async () => {
      const designData = {
        name: 'Performance Test Design',
        width: 800,
        height: 600
      }

      const startTime = Date.now()
      
      const response = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(designData)
        .expect(201)

      const duration = Date.now() - startTime
      
      expect(response.body.success).toBe(true)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second

    })

    it('should handle bulk design operations', async () => {
      const designs = []
      const startTime = Date.now()

      // Create 10 designs
      for (let i = 0; i < 10; i++) {
        const designData = {
          name: `Bulk Design ${i}`,
          width: 800,
          height: 600
        }

        const response = await request(app)
          .post('/api/designs')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(designData)
          .expect(201)

        designs.push(response.body.data._id)
      }

      const duration = Date.now() - startTime
      const avgTime = duration / 10
      
      expect(designs).toHaveLength(10)
      expect(avgTime).toBeLessThan(1000) // Average should be less than 1 second

      // Clean up
      for (const designId of designs) {
        await request(app)
          .delete(`/api/designs/${designId}`)
          .set('Authorization', `Bearer ${accessToken}`)
      }
    })

    it('should save large design content efficiently', async () => {
      // Create a design first
      const designResponse = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Large Design Test',
          width: 1920,
          height: 1080
        })
        .expect(201)

      const designId = designResponse.body.data._id

      // Create large design content
      const elements = []
      for (let i = 0; i < 100; i++) {
        elements.push({
          id: `element-${i}`,
          type: 'text',
          x: Math.random() * 1800,
          y: Math.random() * 1000,
          width: 100,
          height: 50,
          content: `Element ${i}`,
          style: {
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#000000'
          }
        })
      }

      const saveData = {
        elements,
        layers: elements.map(el => el.id)
      }

      const startTime = Date.now()
      
      const response = await request(app)
        .put(`/api/designs/${designId}/save`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(saveData)
        .expect(200)

      const duration = Date.now() - startTime
      
      expect(response.body.success).toBe(true)
      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds

      // Clean up
      await request(app)
        .delete(`/api/designs/${designId}`)
        .set('Authorization', `Bearer ${accessToken}`)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent design creation', async () => {
      const promises = []
      const startTime = Date.now()

      // Create 5 designs concurrently
      for (let i = 0; i < 5; i++) {
        const promise = request(app)
          .post('/api/designs')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: `Concurrent Design ${i}`,
            width: 800,
            height: 600
          })
        promises.push(promise)
      }

      const responses = await Promise.all(promises)
      const duration = Date.now() - startTime

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
      })

      expect(duration).toBeLessThan(3000) // Should complete within 3 seconds

      // Clean up
      const deletePromises = responses.map(response => 
        request(app)
          .delete(`/api/designs/${response.body.data._id}`)
          .set('Authorization', `Bearer ${accessToken}`)
      )
      await Promise.all(deletePromises)
    })
  })
})
