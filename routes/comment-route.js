import express from 'express'
import rateLimit from 'express-rate-limit'
import { editComment } from '../controllers/comment-controller.js'

const router = express.Router()

const commentEditLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Too many comment edits. Please try again later.',
})

router.patch('/:commentId', commentEditLimiter, editComment)

export default router
