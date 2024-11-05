import express from 'express'
import {
  comments,
  uploadComment,
  editComment,
  deleteCommtent,
} from '../controllers/comment-controller.js'
import { authenticate } from '../controllers/user-controller.js'

const router = express.Router()

router.get('/:postId', comments)
router.post('/:postId', uploadComment, authenticate)
router.patch('/:commentId', editComment, authenticate)
router.delete('/:commentId', deleteCommtent, authenticate)

export default router
