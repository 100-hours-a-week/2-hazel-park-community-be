import express from 'express'
import {
  registerUser,
  loginUser,
  deleteUser,
} from '../controllers/user-controller.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.delete('/delete', deleteUser)

export default router
