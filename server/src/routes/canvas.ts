import { Router } from 'express'
import { DesignController } from '../controllers/canvasController.js'

const router = Router()
const designController = new DesignController()

// Design CRUD operations  
router.get('/', designController.getDesigns)
router.get('/:id', designController.getDesignById)
router.post('/', designController.createDesign)
router.put('/:id', designController.updateDesign)
router.delete('/:id', designController.deleteDesign)

// Design save operations
router.put('/:id/save', designController.saveDesign)
router.put('/:id/thumbnail', designController.updateThumbnail)

export { router as canvasRouter }
