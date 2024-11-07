import express from 'express'
import {
  registerUser,
  loginUser,
  patchUserName,
  patchUserPw,
  deleteUser,
  logoutUser,
} from '../controllers/user-controller.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/logout', logoutUser)
router.patch('/patchName', patchUserName)
router.patch('/patchPw', patchUserPw)
router.delete('/delete', deleteUser)

export default router
