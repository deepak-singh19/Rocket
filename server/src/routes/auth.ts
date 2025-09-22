import { Router } from 'express'
import { AuthController } from '../controllers/authController.js'
import { 
  secureValidate, 
  secureLoginSchema,
  secureRegisterSchema
} from '../validators/securityValidators.js'
import { authenticate, authRateLimit } from '../middleware/auth.js'

const router = Router()
const authController = new AuthController()

// POST /api/auth/login - User login
router.post('/login', 
  authRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  secureValidate(secureLoginSchema), 
  authController.login
)

// POST /api/auth/register - User registration
router.post('/register', 
  authRateLimit(3, 15 * 60 * 1000), // 3 attempts per 15 minutes
  secureValidate(secureRegisterSchema), 
  authController.register
)

// GET /api/auth/me - Get current user profile
router.get('/me', 
  authenticate, 
  authController.getProfile
)

// POST /api/auth/logout - User logout
router.post('/logout', 
  authenticate, 
  authController.logout
)

export { router as authRouter }