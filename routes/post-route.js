import express from 'express'
import {
  uploadPost,
  posts,
  postDetail,
  editPost,
  deletePost,
} from '../controllers/post-controller.js'

const router = express.Router()

router.post('/', uploadPost)
router.get('/', posts)
router.get('/:postId', postDetail)
router.patch('/:postId', editPost)
router.delete('/:postId', deletePost)

export default router
