import { beforeAll, afterAll } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import fs from 'fs'
import path from 'path'

let mongoServer: MongoMemoryServer

beforeAll(async () => {
  // Create performance results directory
  const resultsDir = path.join(process.cwd(), 'performance-results')
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true })
  }

  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  
  // Connect to MongoDB
  await mongoose.connect(mongoUri)

})

afterAll(async () => {
  // Clean up
  await mongoose.disconnect()
  await mongoServer.stop()

})
