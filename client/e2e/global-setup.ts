import { chromium, FullConfig } from '@playwright/test'
import mongoose from 'mongoose'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')
  
  // Connect to test database
  const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canvas-studio-test'
  
  try {
    await mongoose.connect(TEST_DB_URI)
    console.log('✅ Connected to test database')
    
    // Clear any existing test data
    const collections = mongoose.connection.collections
    for (const key in collections) {
      const collection = collections[key]
      await collection.deleteMany({})
    }
    console.log('✅ Cleared test database')
    
    await mongoose.connection.close()
    console.log('✅ Closed database connection')
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    throw error
  }
  
  // Wait for servers to be ready
  console.log('⏳ Waiting for servers to be ready...')
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  console.log('✅ Global setup completed')
}

export default globalSetup
