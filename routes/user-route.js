import express from 'express'
import {
  registerUser,
  loginUser,
  patchUserName,
  patchUserPw,
  deleteUser,
  logoutUser,
  authenticate,
} from '../controllers/user-controller.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/logout', logoutUser)
router.patch('/patchName', patchUserName, authenticate)
router.patch('/patchPw', patchUserPw, authenticate)
router.delete('/delete', deleteUser, authenticate)

export default router
