// [jeff] router 코드의 경우 api-path 가 직접 적시되어 있지 않아서 가끔 API Path를 착각하는 휴먼에러가 발생할 수 있습니다.
// 권장드리는 방법은 api path 를 코드 첫 라인에 적시해주는 것입니다.
// 코드 사이즈 커지기 시작하면 라우터 어딨는지 찾는것도 일이라서 비즈니스 로직 개발하다가 흐름 끊어져서 짜증이 올라오기도 해요
// 다른 라우터도 마찬가지 입니다.

// path `/api/auth`
import express from 'express'
import { loginUser, logoutUser } from '../controllers/user-controller.js'

const router = express.Router()

router.post('/login', loginUser)
router.post('/logout', logoutUser)

export default router
