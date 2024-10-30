import express from 'express'
import {
  registerUser,
  loginUser,
  patchUserName,
  patchUserPw,
  deleteUser,
} from '../controllers/user-controller.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.patch('/patchName', patchUserName)
router.patch('/patchPw', patchUserPw)
router.delete('/delete', deleteUser)

export default router
