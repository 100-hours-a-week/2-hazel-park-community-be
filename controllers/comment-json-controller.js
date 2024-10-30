import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataFilePath = path.join(__dirname, '../models/comments.json')

export const readCommentsFromFile = () => {
  if (!fs.existsSync(dataFilePath)) {
    return []
  }
  const data = fs.readFileSync(dataFilePath)
  return JSON.parse(data)
}

export const writeCommentsToFile = (comments) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(comments, null, 2))
}
