import AWS from 'aws-sdk'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

// AWS S3 설정
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-northeast-2', // AWS 리전
})

export const uploadImageToS3 = async (file) => {

  const params = {
    Bucket: 'hazel2-community-s3', // S3 버킷 이름
    Key: `${Date.now()}_${file.originalname}`, // 이미지 파일 이름 (중복 방지)
    Body: file.buffer, // Multer 메모리 스토리지의 버퍼 사용
    ContentType: file.mimetype, // 파일 MIME 타입
    ACL: 'public-read', // 퍼블릭 읽기 권한 설정
  }

  // cdn 링크로 반환
  return s3
    .upload(params)
    .promise()
    .then((uploadResult) => {
      return `https://d9gfwmpqmyevi.cloudfront.net/${uploadResult.Key}`
    })
    .catch((error) => {
      console.error('S3 업로드 실패:', error)
      throw new Error('S3 업로드에 실패했습니다.')
    })
}
