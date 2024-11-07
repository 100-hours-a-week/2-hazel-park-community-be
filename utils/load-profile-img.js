import fs from 'fs'
import path from 'path'

export function loadProfileImg(imagePath) {
  if (imagePath) {
    if (fs.existsSync(imagePath)) {
      try {
        const image = fs.readFileSync(imagePath)
        return `data:image/jpeg;base64,${image.toString('base64')}`
      } catch (error) {
        console.error('이미지 파일을 읽는 중 오류 발생:', error)
      }
    } else {
      console.warn('프로필 이미지 파일을 찾을 수 없습니다:', imagePath)
    }
  }
  return null
}
