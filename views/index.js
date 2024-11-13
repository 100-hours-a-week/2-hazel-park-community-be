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
const secret_key = process.env.SECRET_KEY

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
