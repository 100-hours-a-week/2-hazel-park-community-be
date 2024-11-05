import express from 'express'
import {
  uploadPost,
  posts,
  postDetail,
  editPost,
  deletePost,
  updateLikes,
} from '../controllers/post-controller.js'
import { authenticate } from '../controllers/user-controller.js'

const router = express.Router()

router.post('/', uploadPost, authenticate)
router.get('/', posts)
router.get('/:postId', postDetail)
router.patch('/:postId', editPost, authenticate)
router.delete('/:postId', deletePost, authenticate)
router.patch('/likes/:postId', updateLikes, authenticate)

export default router
