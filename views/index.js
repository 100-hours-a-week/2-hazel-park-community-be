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
import path from 'path'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

dotenv.config({ path: '../.env' })
const app = express()
const PORT = 3000
const secret_key = process.env.SECRET_KEY

app.use(
  cors({
    origin: [
      'http://52.79.154.1',
      'http://localhost',
      'http://127.0.0.1:5500',
      'http://blue-v2-env.eba-vathmjjq.ap-northeast-2.elasticbeanstalk.com',
      'http://green-v2-env.ap-northeast-2.elasticbeanstalk.com',
      'http://blue-v2-env.ap-northeast-2.elasticbeanstalk.com',
    ],
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
      sameSite: 'lax',
    },
  }),
)

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: 'Too many requests from this IP, please try again after 15 minutes.',
// })

// app.use(limiter)

app.use(helmet())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)

app.use(
  express.static(
    '/home/ubuntu/2-hazel-park-community-fe/html',

    {
      extensions: ['html', 'htm'],
    },
  ),
)

// app.use(
//   '/html',
//   express.static(path.join('/home/ubuntu/2-hazel-park-community-fe/html')),
// )

app.use(
  '/components',
  express.static(
    path.join('/home/ubuntu/2-hazel-park-community-fe/components'),
  ),
)
app.use(
  '/styles',
  express.static(path.join('/home/ubuntu/2-hazel-park-community-fe/styles')),
)
app.use(
  '/scripts',
  express.static(path.join('/home/ubuntu/2-hazel-park-community-fe/scripts')),
)
app.use(
  '/utils',
  express.static(path.join('/home/ubuntu/2-hazel-park-community-fe/utils')),
)
app.use(
  '/services',
  express.static(path.join('/home/ubuntu/2-hazel-park-community-fe/services')),
)
app.use(
  '/assets',
  express.static(path.join('/home/ubuntu/2-hazel-park-community-fe/assets')),
)

app.get('/', (req, res) => {
  res.sendFile('/home/ubuntu/2-hazel-park-community-fe/html/Posts.html') // index.html 경로
})

app.listen(PORT, () => {
  console.log(`blue server is running at ${PORT}`)
})
