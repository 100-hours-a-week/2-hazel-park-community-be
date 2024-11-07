import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataFilePath = path.join(__dirname, '../models/comments.json')

export const readCommentsFromFile = () => {
  try {
    const data = fs.readFileSync(dataFilePath)
    return JSON.parse(data)
  } catch (error) {
    console.error('파일 읽기 오류:', error)
    return []
  }
}

export const writeCommentsToFile = (comments) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(comments, null, 2))
  } catch (error) {
    throw new Error('파일 저장에 실패했습니다.')
  }
}
