import bcrypt from 'bcrypt'
import multer from 'multer'
import path from 'path'
import { loadProfileImg } from '../utils/load-profile-img.js'
import conn from '../database/maria.js'
import { uploadImageToS3 } from '../utils/upload-s3.js'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 25 * 1024 * 1024,
    fileSize: 10 * 1024 * 1024,
  },
})

// 회원 가입
export const registerUser = (req, res) => {
  upload.single('profile_pic')(req, res, (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: '프로필 이미지 등록에 실패했습니다.' })
    }

    const { email, password, nickname } = req.body
    console.log('요청 바디 확인')

    // 이메일 중복 검사
    const checkEmailQuery = 'SELECT * FROM USER WHERE email = ?'
    conn.query(checkEmailQuery, [email], (error, results) => {
      if (error)
        return res.status(500).json({ message: '데이터베이스 에러', error })

      if (results.length > 0) {
        return res.status(400).json({ message: '이미 존재하는 이메일입니다.' })
      }
      console.log('이메일 확인')

      // 닉네임 중복 검사
      const checkNicknameQuery = 'SELECT * FROM USER WHERE name = ?'
      conn.query(checkNicknameQuery, [nickname], (error, results) => {
        if (error)
          return res.status(500).json({ message: '데이터베이스 에러', error })

        if (results.length > 0) {
          return res.status(400).json({ message: '중복된 닉네임 입니다.' })
        }
        console.log('닉네임 확인')

        // 비밀번호 암호화
        const hashedPw = bcrypt.hashSync(password, 10)

        // 유저 등록
        const insertUserQuery = `
          INSERT INTO USER (email, pw, name, img) 
          VALUES (?, ?, ?, ?)
        `
        let profilePic = null
        if (req.file) {
          profilePic = req.file ? uploadImageToS3(req.file) : null
        }
        console.log('파일 확인')

        conn.query(
          insertUserQuery,
          [email, hashedPw, nickname, profilePic],
          (error) => {
            if (error) {
              console.error('회원가입 에러:', error.sqlMessage)
              return res
                .status(500)
                .json({ message: '회원가입에 실패했습니다.', error })
            }
            res.status(201).json({ message: '회원가입이 완료되었습니다.' })
          },
        )
      })
    })
  })
}

// 로그인
export const loginUser = (req, res) => {
  const { email, password } = req.body

  // 해당 이메일 값을 갖는 유저가 존재하는지 검색
  const checkUserInfo = 'SELECT * FROM USER WHERE email = ?'
  conn.query(checkUserInfo, [email], (error, result) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: error.sqlMessage, error })
    }

    // 유저가 존재하는 경우
    if (result.length > 0) {
      // 비밀번호가 일치하는지 검사
      const checkPw = bcrypt.compareSync(password, result[0].pw)
      if (checkPw) {
        const user = result[0]
        const sessionUser = {
          email: user.email,
          nickname: user.name,
          profile_picture: null,
        }

        // 유저의 프로필 이미지가 존재하는 경우
        if (user.img) {
          sessionUser.profile_picture = user.img.startsWith('http')
            ? user.img // S3 URL인 경우 그대로 반환
            : loadProfileImg(path.join('../uploads', user.img)) // 로컬 파일인 경우
        }

        req.session.user = sessionUser
        res.status(200).json({
          message: '로그인에 성공하였습니다.',
          user: sessionUser,
        })
      } else {
        res.status(400).json({ message: '비밀번호가 틀렸습니다.' })
      }
    } else {
      res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
    }
  })
}

// 회원 닉네임 or 프로필 이미지 수정
export const userInfo = (req, res) => {
  // 프로필 이미지 업로드 처리
  upload.single('new_profile_img')(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: '프로필 이미지 변경에 실패했습니다.' })
    }

    const { email, nickname } = req.body

    const existingUsers = 'SELECT * FROM USER WHERE name = ? AND email != ?'
    conn.query(existingUsers, [nickname, email], (error, result) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ message: error.sqlMessage, error })
      }

      if (result.length > 0) {
        return res.status(400).json({ message: '중복된 닉네임 입니다.' })
      }

      // 업데이트할 필드와 값을 동적으로 구성
      let updateQuery = 'UPDATE USER SET name = ?'
      let queryParams = [nickname]

      // 프로필 이미지가 있는 경우 쿼리에 추가
      if (req.file) {
        const uploadResult = uploadImageToS3(req.file) // S3에 업로드
        updateQuery += ', img = ?'
        queryParams.push(uploadResult) // S3 URL 저장
      }

      // WHERE 절 추가
      updateQuery += ' WHERE email = ?'
      queryParams.push(email)

      conn.query(updateQuery, queryParams, (error, result) => {
        if (error) {
          console.log(error)
          return res.status(500).json({ message: error.sqlMessage, error })
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
        } else {
          res
            .status(200)
            .json({ message: '사용자 정보가 업데이트 되었습니다.' })
        }
      })
    })
  })
}

// 회원 비밀번호 수정
export const userPw = (req, res) => {
  const { email, password } = req.body

  const existingUsers = 'SELECT * FROM USER WHERE email = ?'
  conn.query(existingUsers, [email], (error, result) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: error.sqlMessage, error })
    }

    if (result.length > 0) {
      const updateQuery = 'UPDATE USER SET pw = ? WHERE email = ?'
      conn.query(
        updateQuery,
        [bcrypt.hashSync(password, 10), email],
        (error, result) => {
          if (error) {
            console.log(error)
            return res.status(500).json({ message: error.sqlMessage, error })
          }
          if (result.affectedRows === 0) {
            return res
              .status(404)
              .json({ message: '사용자를 찾을 수 없습니다.' })
          } else {
            res.status(200).json({ message: '비밀번호가 업데이트 되었습니다.' })
          }
        },
      )
    }
  })
}

// 회원 탈퇴
export const deleteUser = (req, res) => {
  const email = req.params.email

  const deleteQuery = 'DELETE FROM USER WHERE email = ?'

  conn.query(deleteQuery, [email], (error, result) => {
    if (error) {
      console.error(error)
      return res.status(500).json({ message: error.sqlMessage, error })
    }

    // affectedRows가 0이면 사용자가 존재하지 않음
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
    }

    // 성공적으로 삭제된 경우
    res.status(204).send()
  })
}

export const logoutUser = (req, res) => {
  try {
    req.session = null
    res.clearCookie('session')

    res.status(200).json({ message: '로그아웃에 성공하였습니다.' })
  } catch (error) {
    res.status(500).json({ message: '로그아웃에 실패하였습니다.' })
  }
}
