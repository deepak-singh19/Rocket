import express from 'express'
import { authenticate as auth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createComment,
  getComments,
  getCommentReplies,
  updateComment,
  deleteComment,
  resolveComment,
  getDesignUsers
} from '../controllers/commentController.js'
import {
  createCommentSchema,
  updateCommentSchema,
  getCommentsSchema,
  resolveCommentSchema,
  commentIdSchema,
  designIdSchema
} from '../validators/commentValidators.js'

const router = express.Router()

// All comment routes require authentication
router.use(auth)

// Get comments for a design
router.get(
  '/design/:designId',
  validate(designIdSchema),
  validate(getCommentsSchema),
  getComments
)

// Get replies for a specific comment
router.get(
  '/:commentId/replies',
  validate(commentIdSchema),
  getCommentReplies
)

// Get users for @mention autocomplete in a design
router.get(
  '/design/:designId/users',
  validate(designIdSchema),
  getDesignUsers
)

// Create a new comment
router.post(
  '/',
  validate(createCommentSchema),
  createComment
)

// Update a comment
router.put(
  '/:commentId',
  validate(commentIdSchema),
  validate(updateCommentSchema),
  updateComment
)

// Delete a comment
router.delete(
  '/:commentId',
  validate(commentIdSchema),
  deleteComment
)

// Resolve/unresolve a comment
router.patch(
  '/:commentId/resolve',
  validate(commentIdSchema),
  validate(resolveCommentSchema),
  resolveComment
)

export default router
