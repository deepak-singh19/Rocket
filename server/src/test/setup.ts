import { beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'

// Test database connection
const TEST_DB_URI = process.env.TEST_DB_URI || 'mongodb://localhost:27017/canvas-studio-test'

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(TEST_DB_URI)
})

afterAll(async () => {
  // Clean up test database and close connection
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase()
  }
  await mongoose.connection.close()
})

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections
  for (const key in collections) {
    const collection = collections[key]
    if (collection) {
      await collection.deleteMany({})
    }
  }
})
