import express from 'express'
import { comments, editComment } from '../controllers/comment-controller.js'

const router = express.Router()

router.get('/:postId', comments)
router.patch('/:commentId', editComment)

export default router
