import express from 'express'
import bodyParser from 'body-parser'

const app = express()
const port = 3000

app.use(express.json())
app.use(bodyParser.json())

let userInfo = {}

// NOTE: 등록된 유저 존재 확인
function findUser(username) {
  if (!userInfo[username]) {
    return res.status(404).end('use not found')
  }
}

// NOTE: 현재 저장된 유저 리스트 출력
app.get('/', (req, res) => {
  res.send('hello world')
})

// NOTE: 현재 저장된 유저 리스트 출력
app.get('/users', (req, res) => {
  if (Object.keys(userInfo).length === 0) {
    res.send('user data not found')
  } else {
    res.json(userInfo)
  }
})

// NOTE: 새로운 유저 정보 등록
app.post('/users', (req, res) => {
  const { username, id, password } = req.body
  if (username && id && password) {
    userInfo[username] = { id, password }
    res.send(`username: ${username}, id: ${id}, password: ${password}`)
  } else {
    res.send('username and id, password required')
  }
})

// NOTE: 특정 유저의 전체 정보 업데이트
app.put(`/users/:username`, (req, res) => {
  const username = req.params.username
  const { newUsername, newId, newPassword } = req.body
  if (newUsername && newId && newPassword) {
    findUser(username)
    userInfo[newUsername] = { id: newId, password: newPassword }
    delete userInfo[username]
    res.send('your info updated')
  } else {
    res.send('newUsername and newId, newPassword required')
  }
})

// NOTE: 특정 유저의 비밀번호 업데이트
app.patch('/users/:username', (req, res) => {
  const username = req.params.username
  const { newPassword } = req.body
  if (newPassword) {
    findUser(username)
    userInfo[username].password = newPassword
    res.send(`your new password is ${newPassword}`)
  } else {
    res.send('newPassword required')
  }
})

// NOTE: 특정 유저 정보 삭제
app.delete(`/users/:username`, (req, res) => {
  const username = req.params.username
  findUser(username)
  delete userInfo[username]
  res.send('your info deleted')
})

app.listen(port, () => {
  console.log(`server is running at ${port}`)
})
