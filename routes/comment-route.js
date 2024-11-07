import express from 'express'
import {
  editComment,
  deleteComment,
} from '../controllers/comment-controller.js'

const router = express.Router()

router.patch('/:commentId', editComment)
router.delete('/:commentId', deleteComment)

export default router
