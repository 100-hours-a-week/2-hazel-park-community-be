import { readUsersFromFile, writeUsersToFile } from './user-json-controller.js'

export const registerUser = (req, res) => {
  const { email, password, nickname } = req.body
  const users = readUsersFromFile()

  const existingUser = users.find((user) => user.user_email === email)
  if (existingUser) {
    return res.status(400).json({ message: '이미 존재하는 이메일입니다.' })
  }

  const newUser = {
    user_email: email,
    user_pw: password,
    user_name: nickname,
  }
  users.push(newUser)
  writeUsersToFile(users)
  res.status(201).json({ message: '회원가입 성공!' })
}

export const loginUser = (req, res) => {
  const { email, password } = req.body
  const users = readUsersFromFile()

  const user = users.find(
    (user) => user.user_email === email && user.user_pw === password,
  )
  if (user) {
    res.status(200).json({ message: '로그인 성공!', user })
  } else {
    res.status(404).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' })
  }
}

export const patchUserName = (req, res) => {
  const { email, nickname } = req.body
  const users = readUsersFromFile()

  const user = users.find((user) => user.user_email === email)
  if (user) {
    user.user_name = nickname
  } else {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
  }

  writeUsersToFile(users)
  res.status(200).json({ message: '닉네임 업데이트 성공 야호야호' })
}

//export const patchUserPw = (req, rew) => {}

export const deleteUser = (req, res) => {
  const { email } = req.body
  const users = readUsersFromFile()

  const userIndex = users.findIndex((user) => user.user_email === email)
  if (userIndex === -1) {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
  }

  users.splice(userIndex, 1)
  writeUsersToFile(users)
  res.status(200).json({ message: '회원 탈퇴 성공!' })
}
