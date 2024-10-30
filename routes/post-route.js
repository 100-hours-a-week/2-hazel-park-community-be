import express from 'express'
import { uploadPost } from '../controllers/post-controller.js'

const router = express.Router()

router.post('/upload', uploadPost)

export default router
