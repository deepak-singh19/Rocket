import { FullConfig } from '@playwright/test'
import mongoose from 'mongoose'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...')
  
  // Connect to test database
  const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canvas-studio-test'
  
  try {
    await mongoose.connect(TEST_DB_URI)
    console.log('✅ Connected to test database')
    
    // Clear test data
    const collections = mongoose.connection.collections
    for (const key in collections) {
      const collection = collections[key]
      await collection.deleteMany({})
    }
    console.log('✅ Cleared test database')
    
    // Drop the test database
    await mongoose.connection.db.dropDatabase()
    console.log('✅ Dropped test database')
    
    await mongoose.connection.close()
    console.log('✅ Closed database connection')
  } catch (error) {
    console.error('❌ Database teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  }
  
  console.log('✅ Global teardown completed')
}

export default globalTeardown
