import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { expressCspHeader } from 'express-csp-header'
import authRoutes from '../routes/auth-route.js'
import userRoutes from '../routes/user-route.js'
import postRoutes from '../routes/post-route.js'
import commentRoutes from '../routes/comment-route.js'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })
const app = express()
const PORT = 3000

// [jeff] 환경변수로 키를 넘겨줘야 하는 경우 package.json 내 script 키 값 안에 포함시키거나 전용 실행 스크립트를 작성하는게 좋습니다.
// 실제 프로젝트에서 환경변수를 어디까지 노출시켜야 하는지에 대해서는 상황마다 방법이 다 다릅니다. 깃헙 시크릿도 있고 AWS Secret manager 도 있고 별도 외부 저장소에서 끌어오는 방법 등등..
// 지금은 테스트를 위해 하드코딩 진행하겠습니다.
const secret_key = "123123"

app.use(
  cors({
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }),
)

app.use(
  expressCspHeader({
    policy: {
      'default-src': ["'self'"],
    },
    reportOnly: false,
  }),
)

app.use(cookieParser(secret_key))
app.use(
  session({
    secret: secret_key,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'none',
    },
  }),
)

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`)
})
