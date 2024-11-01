import express from 'express'
import {
  comments,
  uploadComment,
  editComment,
  deleteCommtent,
} from '../controllers/comment-controller.js'

const router = express.Router()

router.get('/:postId', comments)
router.post('/:postId', uploadComment)
router.patch('/:commentId', editComment)
router.delete('/:commentId', deleteCommtent)

export default router
