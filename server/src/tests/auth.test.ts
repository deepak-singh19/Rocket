import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../index.js'
import { User } from '../models/User.js'

describe('Authentication System', () => {
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri)
  })

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.user.name).toBe(userData.name)
      expect(response.body.data.tokens.accessToken).toBeDefined()
      expect(response.body.data.tokens.refreshToken).toBeDefined()
      expect(response.body.data.user.password).toBeUndefined() // Password should not be returned
    })

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPass123!',
        name: 'Test User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: '123',
        name: 'Test User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User'
      }

      // First registration should succeed
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      // Second registration with same email should fail
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409)

      expect(response.body.code).toBe('USER_EXISTS')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        email: 'login@example.com',
        password: 'LoginPass123!',
        name: 'Login User'
      })
      await user.save()
    })

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'LoginPass123!'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(loginData.email)
      expect(response.body.data.tokens.accessToken).toBeDefined()
      expect(response.body.data.tokens.refreshToken).toBeDefined()
    })

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'LoginPass123!'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.code).toBe('INVALID_CREDENTIALS')
    })

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'WrongPassword123!'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.code).toBe('INVALID_CREDENTIALS')
    })

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400)

      expect(response.body.code).toBe('MISSING_CREDENTIALS')
    })
  })

  describe('GET /api/auth/me', () => {
    let accessToken: string

    beforeEach(async () => {
      // Create a test user and get token
      const user = new User({
        email: 'profile@example.com',
        password: 'ProfilePass123!',
        name: 'Profile User'
      })
      await user.save()

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'profile@example.com',
          password: 'ProfilePass123!'
        })

      accessToken = loginResponse.body.data.tokens.accessToken
    })

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('profile@example.com')
      expect(response.body.data.user.name).toBe('Profile User')
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.code).toBe('MISSING_TOKEN')
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.code).toBe('INVALID_TOKEN')
    })
  })

  describe('Protected Design Endpoints', () => {
    let accessToken: string
    let userId: string

    beforeEach(async () => {
      // Create a test user and get token
      const user = new User({
        email: 'designer@example.com',
        password: 'DesignerPass123!',
        name: 'Designer User'
      })
      await user.save()
      userId = user._id.toString()

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'designer@example.com',
          password: 'DesignerPass123!'
        })

      accessToken = loginResponse.body.data.tokens.accessToken
    })

    it('should create design with valid token', async () => {
      const designData = {
        name: 'Test Design',
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
    })

    it('should reject design creation without token', async () => {
      const designData = {
        name: 'Test Design',
        width: 800,
        height: 600
      }

      const response = await request(app)
        .post('/api/designs')
        .send(designData)
        .expect(401)

      expect(response.body.code).toBe('MISSING_TOKEN')
    })
  })
})
