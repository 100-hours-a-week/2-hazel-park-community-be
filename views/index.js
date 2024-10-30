import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import userRoutes from '../routes/user-route.js'

const app = express()
const PORT = 3000

app.use(
  cors({
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
  }),
)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api/users', userRoutes)

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`)
})
