import express from 'express'
import { comments } from '../controllers/comment-controller.js'

const router = express.Router()

router.get('/:postId', comments)

export default router
