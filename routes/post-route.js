import express from 'express'
import {
  uploadPost,
  posts,
  postDetail,
  editPost,
  deletePost,
  updateLikes,
} from '../controllers/post-controller.js'
import {
  comments,
  uploadComment,
  deleteComment,
} from '../controllers/comment-controller.js'

const router = express.Router()

router.post('/', uploadPost)
router.get('/', posts)
router.get('/:postId', postDetail)
router.patch('/:postId', editPost)
router.delete('/:postId', deletePost)
router.patch('/:postId/likes', updateLikes)

router.get('/:postId/comments', comments)
router.post('/:postId/comment', uploadComment)
router.delete('/:postId/:commentId', deleteComment)

export default router
