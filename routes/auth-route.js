import express from 'express'
import rateLimit from 'express-rate-limit'
import { loginUser, logoutUser } from '../controllers/user-controller.js'

const router = express.Router()

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.body.email || req.ip,
  message: 'Too many login attempts. Please try again after 15 minutes.',
})

router.post('/login', loginLimiter, loginUser)
router.post('/logout', logoutUser)

export default router
