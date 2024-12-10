import AWS from 'aws-sdk'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

// AWS S3 설정
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-northeast-2', // AWS 리전
})

export const uploadImageToS3 = (file) => {
  console.log(file) // 파일 정보 로그 확인

  // 파일 경로에서 파일을 읽어와서 Buffer로 전달
  const fileBuffer = fs.readFileSync(file.path)

  console.log(fileBuffer)

  const params = {
    Bucket: 'hazel-community-s3', // S3 버킷 이름
    Key: `${Date.now()}_${file.originalname}`, // 이미지 파일 이름 (중복 방지)
    Body: fileBuffer, // 파일 내용 (multer로부터 받은 파일 버퍼)
    ContentType: file.mimetype, // 파일 MIME 타입
    ACL: 'public-read', // 퍼블릭 읽기 권한 설정
  }

  // cdn 링크로 반환
  return s3
    .upload(params)
    .promise()
    .then((uploadResult) => {
      return `https://d1q5km98omun05.cloudfront.net/${uploadResult.Key}`
    })
}
