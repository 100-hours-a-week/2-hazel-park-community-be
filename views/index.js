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


// [jeff] dotenv는 기본적으로 프로젝트 루트의 .env 파일을 로드합니다.
// 특별한 이유가 없다면 경로를 지정하지 않아도 됩니다.
// 또한, 프로젝트의 엔트리 포인트가 되는 index.js 를 별다른 이유가 없다면 views 말고 루트 위치로 옮기는게 좋습니다.
// 팁: dotenv 설정은 코드 상단에 배치하여 환경 변수를 즉시 사용할 수 있도록 하는게 좋습니다.
dotenv.config()
// dotenv.config({ path: '../.env' })

const app = express()

// [jeff] 포트 번호를 환경 변수로부터 가져오도록 수정합니다.
// 이렇게 하면 환경에 따라 포트 번호를 유연하게 변경할 수 있습니다.
// 나중에 배포 나갈 때 편합니다.
const PORT = process.env.PORT || 3000
// const PORT = 3000

// [jeff] 환경변수로 키를 넘겨줘야 하는 경우 package.json 내 script 키 값 안에 포함시키거나 전용 실행 스크립트를 작성하는게 좋습니다.
// 실제 프로젝트에서 환경변수를 어디까지 노출시켜야 하는지에 대해서는 상황마다 방법이 다 다릅니다. 깃헙 시크릿도 있고 AWS Secret manager 도 있고 별도 외부 저장소에서 끌어오는 방법 등등..
// 지금은 테스트를 위해 하드코딩 진행하겠습니다.
const secret_key = "123123"


// [jeff] CORS 설정에서 허용할 도메인을 환경 변수로 관리하면 개발 및 배포 환경에서 유연하게 대처할 수 있습니다.
// 여러 도메인을 지원하도록 설정을 변경합니다.
// "," 를 기준으로 스플릿 하도록 도메인을 나열해주면 되는 것이니 편리하지요.
// 로컬에서야 뭐.. 상관없고 하하
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://127.0.0.1:5500']

app.use(
  cors({
    // origin: 'http://127.0.0.1:5500',
    origin: allowedOrigins,
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


// [jeff] Express 4.16 버전 이상에서는 bodyParser가 내장되어 있으므로 별도의 모듈이 없어도 됩니다.
// express 에서 직접 express.json()과 express.urlencoded()를 사용할 수 있답니당
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// app.use(bodyParser.json({ limit: '50mb' }))
// app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)


// [jeff] 오류 처리 미들웨어를 추가하여 에러 발생 시 일관된 응답을 제공할 수도 있습니다.
app.use((err, req, res, next) => {
  // error intercepter, error middleware, error handler 등등 부르는 이름이 많습니다.
  // 부르는 명칭은 많으나 중요한건 "최종적으로 걸러지지 않은 에러를 찾아서 보여준다" 가 핵심입니다.
  console.error(err.stack)
  res.status(500).json({ message: '서버 오류가 발생했습니다.', error: err.message })
})


app.listen(PORT, () => {
  // [jeff] 로깅을 위해 winston, morgan 같은 로깅 미들웨어를 알아두시는 것도 좋답니당 👴
  console.log(`server is running at ${PORT}`)
})
