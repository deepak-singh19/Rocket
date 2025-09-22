import { beforeAll, afterAll } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongoServer: MongoMemoryServer

beforeAll(async () => {
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
