import express from 'express'
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

router.post('/email', checkEmail)
router.post('/nickname', checkNickname)
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/user-session', getSessionUser)
router.post('/logout', logoutUser)
router.patch('/info', userInfo)
router.patch('/password', userPw)
router.delete('/:email', deleteUser)

export default router
