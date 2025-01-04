import bcrypt from 'bcrypt'
import multer from 'multer'
import path from 'path'
import { loadProfileImg } from '../utils/load-profile-img.js'
import conn from '../database/maria.js'
import { uploadImageToS3 } from '../utils/upload-s3.js'

const storage = multer.memoryStorage()

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 25 * 1024 * 1024,
    fileSize: 5 * 1024 * 1024,
  },
})

export const checkEmail = (req, res) => {
  const { email } = req.body
  console.log('요청 바디 확인', email)

  if (!email) {
    return res.status(400).json({ message: '이메일을 입력해주세요.' })
  }

  const checkEmailQuery = 'SELECT * FROM USER WHERE email = ?'
  conn.query(checkEmailQuery, [email], (error, results) => {
    if (error) {
      console.error('데이터베이스 에러:', error)
      return res.status(500).json({ message: '데이터베이스 에러', error })
    }

    if (results.length > 0) {
      console.log('이메일 중복 확인: 이미 존재하는 이메일')
      return res
        .status(400)
        .json({ code: 400, message: '이미 존재하는 이메일입니다.' })
    }

    console.log('이메일 중복 확인: 사용 가능한 이메일')
    return res
      .status(200)
      .json({ code: 200, message: '사용 가능한 이메일입니다.' })
  })
}

export const checkNickname = (req, res) => {
  const { nickname } = req.body
  console.log('요청 바디 확인', nickname)

  if (!nickname) {
    return res.status(400).json({ message: '닉네임을 입력해주세요.' })
  }

  const checkNicknameQuery = 'SELECT * FROM USER WHERE name = ?'
  conn.query(checkNicknameQuery, [nickname], (error, results) => {
    if (error) {
      console.error('데이터베이스 에러:', error)
      return res.status(500).json({ message: '데이터베이스 에러', error })
    }

    if (results.length > 0) {
      console.log('닉네임 중복 확인: 중복된 닉네임')
      return res
        .status(400)
        .json({ code: 400, message: '중복된 닉네임 입니다.' })
    }

    console.log('닉네임 중복 확인: 사용 가능한 닉네임')
    return res
      .status(200)
      .json({ code: 200, message: '사용 가능한 닉네임입니다.' })
  })
}

// 회원 가입
export const registerUser = (req, res) => {
  upload.single('profile_pic')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message:
            '파일 크기가 5MB를 초과했습니다. 더 작은 파일을 업로드해주세요.',
        })
      }

      return res.status(400).json({
        message: '게시글 이미지 업로드에 실패했습니다.',
        error: err.message,
      })
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
      conn.query(checkNicknameQuery, [nickname], async (error, results) => {
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
          // 파일 크기 검증
          if (req.file.size > 20 * 1024 * 1024) {
            return res.status(400).json({
              message:
                '파일 크기가 5MB를 초과했습니다. 더 작은 파일을 업로드해주세요.',
            })
          }
          try {
            profilePic = await uploadImageToS3(req.file) // 비동기 처리
          } catch (uploadError) {
            console.error('파일 업로드 에러:', uploadError)
            return res
              .status(500)
              .json({ message: '이미지 업로드에 실패했습니다.' })
          }
        }
        console.log('파일 확인: ', profilePic)

        console.log('실행된 SQL:', insertUserQuery)
        console.log('전달된 값:', [
          email,
          hashedPw,
          nickname,
          profilePic || null,
        ])

        conn.query(
          insertUserQuery,
          [email, hashedPw, nickname, profilePic || null],
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

// 사용자 로그인 확인
export const getSessionUser = (req, res) => {
  if (req.session.user) {
    res.status(200).json({ user: req.session.user })
  } else {
    res.status(401).json({ message: '로그인이 필요합니다.' })
  }
}

// 회원 닉네임 or 프로필 이미지 수정
export const userInfo = (req, res) => {
  // 프로필 이미지 업로드 처리
  upload.single('new_profile_img')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message:
            '파일 크기가 5MB를 초과했습니다. 더 작은 파일을 업로드해주세요.',
        })
      }

      return res.status(400).json({
        message: '게시글 이미지 업로드에 실패했습니다.',
        error: err.message,
      })
    }

    const { email, nickname } = req.body

    // 닉네임 중복 체크
    const checkNicknameQuery = `SELECT email FROM USER WHERE name = ?`

    conn.query(checkNicknameQuery, [nickname], (checkError, results) => {
      if (checkError) {
        console.error('닉네임 중복 체크 중 오류:', checkError)
        return res.status(500).json({
          message: '닉네임 중복 체크에 실패했습니다.',
          error: checkError.sqlMessage,
        })
      }

      if (results.length > 0) {
        return res.status(400).json({ message: '이미 사용 중인 닉네임입니다.' })
      }

      // 유저의 기존 프로필 이미지를 조회
      const selectQuery = `SELECT img FROM USER WHERE email = ?`

      conn.query(selectQuery, [email], async (selectError, selectResults) => {
        if (selectError) {
          console.error('유저 조회 중 오류:', selectError)
          return res.status(500).json({
            message: '유저 조회에 실패했습니다.',
            error: selectError.sqlMessage,
          })
        }

        if (selectResults.length === 0) {
          return res.status(404).json({ message: '유저가 존재하지 않습니다.' })
        }

        // 기존 이미지 URL
        let userImg = selectResults[0].img

        // 새로운 이미지가 업로드된 경우 S3에 업로드
        if (req.file) {
          // 파일 크기 검증
          if (req.file.size > 20 * 1024 * 1024) {
            return res.status(400).json({
              message:
                '파일 크기가 5MB를 초과했습니다. 더 작은 파일을 업로드해주세요.',
            })
          }
          try {
            userImg = await uploadImageToS3(req.file) // 새로운 이미지 URL
          } catch (uploadError) {
            console.error('이미지 업로드 중 오류:', uploadError)
            return res.status(500).json({
              message: '이미지 업로드에 실패했습니다.',
              error: uploadError,
            })
          }
        }

        // 업데이트할 필드와 값을 동적으로 구성
        let updateQuery = 'UPDATE USER SET name = ?'
        const queryParams = [nickname]

        // `img` 필드가 존재할 경우만 쿼리에 추가
        if (req.file) {
          updateQuery += ', img = ?'
          queryParams.push(userImg)
          console.log('바꾼 이미지: ', userImg)
        }

        // WHERE 절 추가
        updateQuery += ' WHERE email = ?'
        queryParams.push(email)

        // 업데이트 실행
        conn.query(updateQuery, queryParams, (updateError, result) => {
          if (updateError) {
            console.error('사용자 정보 업데이트 중 오류:', updateError)
            return res.status(500).json({
              message: '사용자 정보 업데이트에 실패했습니다.',
              error: updateError.sqlMessage,
            })
          }

          if (result.affectedRows === 0) {
            return res
              .status(404)
              .json({ message: '사용자를 찾을 수 없습니다.' })
          }

          // 세션 데이터 갱신
          if (req.session) {
            req.session.user.nickname = nickname // 닉네임 업데이트
            if (req.file) {
              req.session.user.profile_picture = userImg // 프로필 이미지 업데이트
            }
          }

          res.status(200).json({
            message: '사용자 정보가 업데이트 되었습니다.',
            img: userImg, // 업데이트된 이미지 URL 반환
            nickname,
          })
        })
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

    // 세션 제거
    req.session.destroy((err) => {
      if (err) {
        console.error('세션 제거 중 오류:', err)
        return res
          .status(500)
          .json({ message: '회원은 삭제되었으나 세션 제거에 실패했습니다.' })
      }

      // 세션 쿠키 제거
      res.clearCookie('session')

      // 성공 응답
      res.status(204).send()
    })
  })
}

export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: '로그아웃 실패.', error: err.message })
    }

    // 세션 쿠키 제거
    res.clearCookie('session')

    // 로그아웃 모두 정상. 성공 응답 전송
    res.status(200).json({ message: '로그아웃 성공' })
  })
}
