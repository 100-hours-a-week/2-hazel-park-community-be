import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { expressCspHeader } from 'express-csp-header'
import userRoutes from '../routes/user-route.js'
import postRoutes from '../routes/post-route.js'
import commentRoutes from '../routes/comment-route.js'

const app = express()
const PORT = 3000

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

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`)
})
