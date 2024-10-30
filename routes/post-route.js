import express from 'express'
import { uploadPost, showPosts } from '../controllers/post-controller.js'

const router = express.Router()

router.post('/upload', uploadPost)
router.get('/', showPosts)

export default router
