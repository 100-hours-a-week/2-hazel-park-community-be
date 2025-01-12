import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  checkEmail,
  checkNickname,
  registerUser,
  loginUser,
  getSessionUser,
  userInfo,
  userPw,
  deleteUser,
  logoutUser,
} from '../controllers/user-controller.js'

const router = express.Router()

const emailCheckLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10, // 최대 10번 요청
  message: 'Too many email checks. Please try again later.',
})

const nicknameCheckLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10, // 최대 10번 요청
  message: 'Too many nickname checks. Please try again later.',
})

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 최대 5번 요청
  keyGenerator: (req) => req.body.email || req.ip, // 이메일 또는 IP 기반
  message: 'Too many registration attempts. Please try again later.',
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 최대 5번 요청
  keyGenerator: (req) => req.body.email || req.ip, // 이메일 또는 IP 기반
  message: 'Too many login attempts. Please try again later.',
})

router.post('/email', emailCheckLimiter, checkEmail)
router.post('/nickname', nicknameCheckLimiter, checkNickname)
router.post('/register', registerLimiter, registerUser)
router.post('/login', loginLimiter, loginUser)
router.get('/user-session', getSessionUser) // 세션 확인은 제한 불필요
router.post('/logout', logoutUser) // 로그아웃은 제한 불필요
router.patch('/info', userInfo)
router.patch('/password', userPw)
router.delete('/:email', deleteUser)

export default router
