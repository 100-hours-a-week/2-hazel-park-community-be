import maria from 'mysql'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

// MySQL 연결 풀 설정
const conn = maria.createPool({
  connectionLimit: 10, // 최대 연결 수
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  charset: 'utf8mb4',
})

conn.getConnection((err, conn) => {
  if (err) {
    console.error('MySQL 연결 실패:', err)
  } else {
    console.log('MySQL에 성공적으로 연결되었습니다.')
  }
})

// conn 객체를 다른 곳에서 사용할 수 있도록 export
export default conn
