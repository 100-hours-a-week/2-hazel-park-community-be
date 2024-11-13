import express from 'express'
import { editComment } from '../controllers/comment-controller.js'

const router = express.Router()

router.patch('/:commentId', editComment)

export default router
