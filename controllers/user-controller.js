import { readUsersFromFile, writeUsersToFile } from './user-json-controller.js'
import bcrypt from 'bcrypt'
import multer from 'multer'
import path from 'path'
import { loadProfileImg } from '../utils/load-profile-img.js'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  },
})

// const upload = multer({
//   storage: storage,
//   limits: {
//     fieldSize: 25 * 1024 * 1024,
//     fileSize: 10 * 1024 * 1024,
//   },
// })


// [jeff] 파일을 직접 다뤄야하는 경우에는 상대경로보다 절대 경로를 사용하는게 좋습니다.
// 배포 나갔을 때 경로가 어떻게 바뀔지 모르기 때문입니다.
// 개발환경에서 상대경로로 가능하던것이 운영환경에선 안먹힐 수 있습니다.
// 왜냐면 배포 과정에서 권한 설정 및 mount hdd 등의 이유로 폴더구조가 바뀔 수 있기 때문입니다.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 업로드 디렉토리의 절대 경로 사용
    const uploadPath = path.join(__dirname, '../uploads/')
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // 파일명 충돌을 방지하기 위해 고유한 파일명 사용
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

export const registerUser = (req, res) => {
  upload.single('profile_pic')(req, res, (err) => {
    if (err) {
      // [jeff] 에러메세지를 구체적으로 주는 것이 좋습니다.
      // 다만, 개발환경에서만 유효한 얘기이며 고객에게는 이 내용이 노출되지 않도록 조정할 필요가 있습니다.
      // 이건.. 배포 할 때 알게 됩니다. 💁‍♂️
      return res
        .status(400)
        .json({ message: '프로필 이미지 등록에 실패했습니다.', error: err.message })
    }

    const { email, password, nickname } = req.body

    // [jeff] 팁: File I/O를 진행하는 코드는 언제나 비동기를 고려해야 합니다.
    // 이 경우에는 어쩔 수 없는 것이니 상관 없으나 기억해두시는게 좋습니다.
    // File I/O는 .. 비동기.. 👴.. batch 처리 할 때 이거 모르면.. 끔찍합니다
    const users = readUsersFromFile()

    // [jeff] 이메일 중복 확인과 유저 닉네임 중복 확인은 별개의 로직이기 때문에 early reteurn 될 수 있도록
    // 로직을 분리하는게 좋습니다.

    // 이메일 중복 확인
    const existingUserEmail = users.find((user) => user.user_email === email)
    if (existingUserEmail) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다.' })
    }

    // 닉네임 중복 확인
    const existingUserName = users.find((user) => user.user_name === nickname)
    if (existingUserName) {
      return res.status(400).json({ message: '중복된 닉네임 입니다.' })
    }

    // const existingUserEmail = users.find((user) => user.user_email === email)
    // const existingUserName = users.find((user) => user.user_name === nickname)

    // if (existingUserEmail || existingUserName) {
    //   if (existingUserEmail) {
    //     return res.status(400).json({ message: '이미 존재하는 이메일입니다.' })
    //   } else if (existingUserName) {
    //     return res.status(400).json({ message: '중복된 닉네임 입니다.' })
    //   }
    // }

    const hashedPw = bcrypt.hashSync(password, 10)

    const newUser = {
      user_email: email,
      user_pw: hashedPw,
      user_name: nickname,
      profile_picture: req.file ? req.file.filename : null,
    }

    users.push(newUser)
    writeUsersToFile(users)

    res.status(201).json({ message: '회원가입이 완료되었습니다.' })
  })
}

export const loginUser = (req, res) => {
  const { email, password } = req.body
  
  // [jeff] 유저를 믿으시나요? 안됩니다 안되요
  // 밖에서 들어온 모든 값은 언제나 반드시 검증해야 합니다.
  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 모두 입력해주세요.' })
  }

  const users = readUsersFromFile()

  
  const user = users.find((user) => user.user_email === email)
  // [jeff] early exit 시키는게 좋습니다. 그러면 else도 안쓰고 if문 indent 하나 뒤로 뺄 수 있어서
  // 가독성도 좋아진답니다.
  if (!user) {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
  }

  const checkPw = bcrypt.compareSync(password, user.user_pw)
  // [jeff] 마찬가지로 early exit
  if (!checkPw) {
    res.status(400).json({ message: '비밀번호가 틀렸습니다.' })
  }
  
  // [jeff] 이러한 로그는 그냥 쓰는 것도 좋지만 전역함수 하나 만들어서 출력하는게 좋습니다.
  // 그러면 실행시간, 콜스택 등을 prefix 등으로 찍어 보기 편해요
  console.log(user.profile_picture)
  const sessionUser = {
    email: user.user_email,
    nickname: user.user_name,
    profile_picture: null,
  }
  
  // [jeff] 정확한 기준은 없으나 한 눈에 봤을 때 파악 안되는 로직은 주석으로 간단한 설명 달아주는게 좋습니다.
  // 그 것이 미래의 본인과 함께 일할 팀원에게 한 줄기 동앗줄이 될 수도 있습니다.
  if (user.profile_picture) {
    const imagePath = path.isAbsolute(user.profile_picture)
      ? user.profile_picture
      : path.join('../uploads', user.profile_picture)
    sessionUser.profile_picture = loadProfileImg(imagePath)
  }

  req.session.user = sessionUser
  res.status(200).json({
    message: '로그인에 성공하였습니다.',
    user: req.session.user,
  })
  console.log('login session:', req.session)

}


// [jeff] 함수명은 해당 행동을 정확하게 지시해주는게 좋습니다.
// userInfo 라는건 너무 포괄적인 이름입니다. 원래 이름짓는게 제일 어렵습니다.
// 저라면 updateUserInfo 로 했을 것 같아용
/**
 * 유저 정보 업데이트
 */
export const updateUserInfo = (req, res) => {
// export const userInfo = (req, res) => {
  upload.single('new_profile_img')(req, res, (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: '프로필 이미지 변경에 실패했습니다.' })
    }
    // [jeff] 불필요한 개행은 하지 않는게 좋습니다. (110, 112 119)
    // 만약 라인을 늘려야 하신다면 정확하게 비즈니스 로직이 구분 되었을 때 주석과 함께 개행하는게 좋습니다.
    const { email, nickname } = req.body

    // [jeff] 입력 받은 데이터는 검증해야 합니다!
    if (!email || !nickname){
      return res.status(400).json({message: '이메일과 새로운 닉네임을 입력하셈'})
    }
    
    // 현재 사용자를 제외한 닉네임 중복 확인
    const users = readUsersFromFile()
    const existingUser = users.find((user) => user.user_name === nickname)
    if (existingUser) {
      return res.status(400).json({ message: '중복된 닉네임 입니다.' })
    }

    // 유저 정보 존재 하는지 확인 후 유저 정보 업데이트
    const user = users.find((user) => user.user_email === email)

    // [jeff] early exit 하는게 좋습니다. else 문은 가급적 쓰지 않는게 좋기 때문입니다.
    // 유지보수 하다보면 if문 조금 복잡해지기 시작하면 엉뚱하게 else 타고 정상상태처럼 실행되는 경우가 생각보다 빈번합니다.
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
    }

    // 유저 정상 상태 확인 된 상황
    user.user_name = nickname
    if (req.file) {
      user.profile_picture = req.file.filename
    }

    // 유저 정보 업데이트 정상 완료 및 응답 전송
    writeUsersToFile(users)
    res.status(200).json({ message: '사용자 정보가 업데이트 되었습니다.' })
  })
}

// [jeff] updateUserPassword 와 같이 함수의 행동을 명확하게 드러내주세요.
export const userPw = (req, res) => {
  const { email, password } = req.body
  // [jeff] 입력 데이터 검증!
  if (!email || !password ) {
    return res.status(400).json({message: '이메일 및 새로운 비밀번호를 입력해야합니다.'})
  }

  const users = readUsersFromFile()

  const user = users.find((user) => user.user_email === email)
  // [jeff] 이 곳도 마찬가지로 else 블럭을 early exit 조건으로 쓰는게 좋습니다.
  if (!user) {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
  }

  user.user_pw = bcrypt.hashSync(password, 10)
  writeUsersToFile(users)
  res.status(200).json({ message: '비밀번호가 업데이트 되었습니다.' })
  } 
}

export const deleteUser = (req, res) => {
  const email = req.params.email
  const users = readUsersFromFile()

  const userIndex = users.findIndex((user) => user.user_email === email)
  if (userIndex === -1) {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
  }
  // [jeff] 사람마다 스타일이 다르긴 하지만.. 코드가 잘 눈에 안들어올 땐
  // 아래와 같이 라인 바이 라인으로 함수의 흐름을 적시하는 것도 방법입니다.
  
  // 사용자를 배열에서 제거
  users.splice(userIndex, 1)
  
  // 유저 데이터 파일에 저장
  writeUsersToFile(users)

  // 모든 로직 성공 후 응답
  res.status(204).send()
}

// [jeff] 라인 바이 라인으로 주석을 달아 본다면 다음과 같습니다.

/**
 * 현재 사용자를 로그아웃 처리한다.
 */
export const logoutUser = (req, res) => {
  // 세션 파괴!💥
  req.session.destroy((err) => {
    if (err)  {
      return res.status(500).json({message:"로그아웃 실패.", error: err.message})
    }

    // 세션 쿠키 제거
    res.clearCookie('session')
  
    // 로그아웃 모두 정상. 성공 응답 전송
    res.status(200).json({message: '로그아웃 성공'})
  })


  // 이렇게 해버리면 세션 파괴 과정에서 에러가 발생한건지 별도 로직에서 에러가 발생한건지 파악하기가 어렵습니다.
  // 따라서 destroy 기능을 사용하는게 좋습니다.
  // try {
  //   req.session = null
  //   res.clearCookie('session')

  //   res.status(200).json({ message: '로그아웃에 성공하였습니다.' })
  // } catch (error) {
  // 
  //   res.status(500).json({ message: '로그아웃에 실패하였습니다.' })
  // }
}
