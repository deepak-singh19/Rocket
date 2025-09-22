import { Router } from 'express'
import { DesignController } from '../controllers/canvasController.js'
import { 
  secureValidate, 
  secureValidateQuery, 
  secureValidateParams,
  secureCreateDesignSchema,
  secureUpdateDesignSchema,
  secureSaveDesignSchema,
  secureAddCommentSchema,
  secureDesignQuerySchema,
  secureDesignParamsSchema,
  secureThumbnailSchema
} from '../validators/securityValidators.js'
import { authenticate, optionalAuth } from '../middleware/auth.js'

const router = Router()
const designController = new DesignController()

// GET /api/designs - List designs with pagination and filtering (optional auth for public designs)
router.get('/', optionalAuth, secureValidateQuery(secureDesignQuerySchema), designController.getDesigns)

// POST /api/designs - Create new design (requires auth)
router.post('/', authenticate, secureValidate(secureCreateDesignSchema), designController.createDesign)

// GET /api/designs/:id - Get design by ID (optional auth for public designs)
router.get('/:id', optionalAuth, secureValidateParams(secureDesignParamsSchema), designController.getDesignById)

// PUT /api/designs/:id - Update design (requires auth)
router.put('/:id', 
  authenticate,
  secureValidateParams(secureDesignParamsSchema), 
  secureValidate(secureUpdateDesignSchema), 
  designController.updateDesign
)

// DELETE /api/designs/:id - Delete design (requires auth)
router.delete('/:id', authenticate, secureValidateParams(secureDesignParamsSchema), designController.deleteDesign)

// POST /api/designs/:id/comments - Add comment to design (requires auth)
router.post('/:id/comments', 
  authenticate,
  secureValidateParams(secureDesignParamsSchema), 
  secureValidate(secureAddCommentSchema), 
  designController.addComment
)

// GET /api/designs/:id/comments - Get comments for design (optional auth)
router.get('/:id/comments', optionalAuth, secureValidateParams(secureDesignParamsSchema), designController.getComments)

// PUT /api/designs/:id/save - Save design content (requires auth)
router.put('/:id/save', 
  authenticate,
  secureValidateParams(secureDesignParamsSchema), 
  secureValidate(secureSaveDesignSchema), 
  designController.saveDesign
)

// GET /api/designs/:id/sync - Get full design state for synchronization (requires auth)
router.get('/:id/sync', 
  authenticate,
  secureValidateParams(secureDesignParamsSchema), 
  designController.syncDesign
)

// DELETE /api/designs/:id/comments/:commentId - Delete comment (requires auth)
router.delete('/:id/comments/:commentId', 
  authenticate,
  secureValidateParams(secureDesignParamsSchema), 
  designController.deleteComment
)

// POST /api/designs/:id/thumbnail - Update design thumbnail (requires auth)
router.post('/:id/thumbnail', 
  authenticate,
  secureValidateParams(secureDesignParamsSchema), 
  secureValidate(secureThumbnailSchema),
  designController.updateThumbnail
)

export { router as designRouter }
