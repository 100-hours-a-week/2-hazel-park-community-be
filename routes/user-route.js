import express from 'express'
import {
  registerUser,
  loginUser,
  userInfo,
  userPw,
  deleteUser,
  logoutUser,
} from '../controllers/user-controller.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/logout', logoutUser)
router.patch('/userInfo', userInfo)
router.patch('/userPw', userPw)
router.delete('/:email', deleteUser)

export default router
