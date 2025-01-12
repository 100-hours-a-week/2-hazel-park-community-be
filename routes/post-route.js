import express from 'express'
import rateLimit from 'express-rate-limit'
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

const postUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10, // 최대 10번 요청
  message: 'Too many posts created. Please try again later.',
})
router.post('/', postUploadLimiter, uploadPost)

const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50, // 최대 50번 요청
  message: 'Too many comments. Please try again later.',
})
router.post('/:postId/comment', commentLimiter, uploadComment)

router.get('/', posts)
router.get('/:postId', postDetail)
router.patch('/:postId', editPost)
router.delete('/:postId', deletePost)
router.patch('/:postId/likes', updateLikes)

router.get('/:postId/comments', comments)
router.delete('/:postId/:commentId', deleteComment)

export default router
