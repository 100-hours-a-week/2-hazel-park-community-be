import maria from 'mysql'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const conn = maria.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
})

conn.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err)
  } else {
    console.log('MySQL에 성공적으로 연결되었습니다.')
  }
})

export default conn
