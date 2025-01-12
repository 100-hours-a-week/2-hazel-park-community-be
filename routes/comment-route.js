import express from 'express'
import rateLimit from 'express-rate-limit'
import { editComment } from '../controllers/comment-controller.js'

const router = express.Router()

const commentEditLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20, // 10분 동안 최대 20번 요청
  message: 'Too many comment edits. Please try again later.',
})

router.patch('/:commentId', commentEditLimiter, editComment)

export default router
