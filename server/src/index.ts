import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { authRouter } from './routes/auth.js'
import { designRouter } from './routes/design.js'
import commentRouter from './routes/comments.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import CollaborationHandler from './socket/collaborationHandler.js'
import { securityMiddleware } from './middleware/security.js'

// Load environment variables
dotenv.config()


const app = express()



const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canvas-studio'

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.error(' MongoDB connection successful')
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  })


// CORS configuration - must be BEFORE security middleware
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    // Allow localhost development origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000', 
      'http://localhost:4000',
      'https://rocket-deepaksingh16cs.replit.app'
    ]
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.log(`[CORS] Blocked origin: ${origin}`)
      callback(null, true) // Allow all origins in development - change to false in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}

app.use(cors(corsOptions))

// Request logger to help debug CORS issues
app.use((req, _res, next) => {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} origin=${req.headers.origin || 'none'}`)
  next()
})



// Security middleware stack
app.use(securityMiddleware)
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.use('/api/auth', authRouter)
app.use('/api/designs', designRouter)
app.use('/api/comments', commentRouter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0'
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Canvas Studio API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      designs: '/api/designs',
      comments: '/api/comments'
    },
    documentation: {
      auth: {
        'POST /api/auth/login': 'Authenticate user and get token',
        'GET /api/auth/verify': 'Verify authentication token'
      },
      designs: {
        'GET /api/designs': 'List all designs with pagination',
        'POST /api/designs': 'Create a new design',
        'GET /api/designs/:id': 'Get design by ID',
        'PUT /api/designs/:id': 'Update design',
        'DELETE /api/designs/:id': 'Delete design',
        'POST /api/designs/:id/comments': 'Add comment to design',
        'GET /api/designs/:id/comments': 'Get comments for design'
      }
    }
  })
})

// Error handling middleware
app.use(notFoundHandler)
app.use(errorHandler)

// Create HTTP server
const httpServer = createServer(app)

// Setup Collaboration Socket.IO
const collaborationHandler = new CollaborationHandler(httpServer)

// Start server
httpServer.listen(PORT, () => {

})

export default app
