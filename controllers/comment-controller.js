import {
  readCommentsFromFile,
  writeCommentsToFile,
} from './comment-json-controller.js'

export const comments = (req, res) => {
  const postId = parseInt(req.params.postId)
  const comments = readCommentsFromFile()

  const postComments = comments[postId]

  if (postComments) {
    res.status(200).json(postComments)
  } else {
    res.staus(404).json({ message: '댓글이 존재하지 않습니다.' })
  }
}
