import {
  readCommentsFromFile,
  writeCommentsToFile,
} from './comment-json-controller.js'

export const comments = (req, res) => {
  const postId = parseInt(req.params.postId)
  const comments = readCommentsFromFile()

  const postComments = comments.comments[postId]

  if (postComments) {
    res.status(200).json(postComments)
  } else {
    res.status(404).json({ message: '댓글이 존재하지 않습니다.' })
  }
}

export const editComment = (req, res) => {
  const commentId = parseInt(req.params.commentId)
  const { postId, content, updatedAt } = req.body
  const comments = readCommentsFromFile()

  const postComments = comments.comments[postId]

  if (!postComments) {
    return res
      .status(404)
      .json({ message: '해당 포스트의 댓글이 존재하지 않습니다.' })
  }

  const comment = postComments.find((comment) => comment.id === commentId)
  if (comment) {
    comment.content = content
    comment.updateAt = updatedAt
    writeCommentsToFile(comments)
    res.status(200).json({ message: '댓글 수정 완료 야호야호' })
  } else {
    return res.status(404).json({ message: '댓글이 존재하지 않습니다.' })
  }
}

export const deleteCommtent = (req, res) => {
  const commentId = parseInt(req.params.commentId)
  const { postId } = req.body
  const comments = readCommentsFromFile()

  const postComments = comments.comments[postId]

  if (!postComments) {
    return res
      .status(404)
      .json({ message: '해당 포스트의 댓들이 존재하지 않습니다.' })
  }

  const commentIndex = postComments.findIndex(
    (comment) => comment.id === commentId,
  )
  if (commentIndex === -1) {
    return res.status(404).json({ message: '댓글이 존재하지 않습니다.' })
  }

  postComments.splice(commentIndex, 1)
  comments.comments[postId] = postComments
  writeCommentsToFile(comments)
  res.status(200).json({ message: '댓글 삭제 성공 야호야호' })
}