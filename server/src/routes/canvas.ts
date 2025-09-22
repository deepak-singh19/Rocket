import { Router } from 'express'
import { CanvasController } from '../controllers/canvasController.js'

const router = Router()
const canvasController = new CanvasController()

// Canvas CRUD operations
router.get('/', canvasController.getAllCanvases)
router.get('/:id', canvasController.getCanvasById)
router.post('/', canvasController.createCanvas)
router.put('/:id', canvasController.updateCanvas)
router.delete('/:id', canvasController.deleteCanvas)

// Canvas export operations
router.post('/:id/export', canvasController.exportCanvas)
router.post('/:id/save-image', canvasController.saveCanvasImage)

export { router as canvasRouter }
