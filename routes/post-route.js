import express from 'express'
import {
  uploadPost,
  posts,
  postDetail,
} from '../controllers/post-controller.js'

const router = express.Router()

router.post('/upload', uploadPost)
router.get('/', posts)
router.get('/postDetail/:postId', postDetail)

export default router
