import {
  readCommentsFromFile,
  writeCommentsToFile,
} from './comment-json-controller.js'

import { readPostsFromFile, writePostsToFile } from './post-json-controller.js'

function checkPostID(postId) {
  if (postId <= 0) {
    return false
  }
  return true
}

export const comments = (req, res) => {
  const postId = parseInt(req.params.postId)
  if (!checkPostID(postId)) {
    return res.status(400).json({ message: '올바르지 않은 post ID 입니다.' })
  }
  const comments = readCommentsFromFile()

  try {
    const postComments = comments.comments[postId]

    if (postComments) {
      res.status(200).json(postComments)
    } else {
      res.status(404).json({ message: '댓글이 존재하지 않습니다.' })
    }
  } catch (error) {
    res.status(500).json({ message: '댓글 조회에 실패했습니다.' })
  }
}

export const uploadComment = (req, res) => {
  try {
    const postId = parseInt(req.params.postId)
    const { writer, updatedAt, content } = req.body
    if (!checkPostID(postId)) {
      return res.status(400).json({ message: '올바르지 않은 post ID 입니다.' })
    }
    const comments = readCommentsFromFile()

    const postComments = comments.comments[postId] || []
    const lastComment = postComments[postComments.length - 1]
    const commentId = lastComment ? lastComment.id + 1 : 1

    const posts = readPostsFromFile()
    const post = posts.find((post) => post.post_id === postId)

    const newComment = {
      id: commentId,
      writer: writer,
      updateAt: updatedAt,
      content: content,
    }

    postComments.push(newComment)
    comments.comments[postId] = postComments
    writeCommentsToFile(comments)

    ++post.post_comments
    writePostsToFile(posts)

    res.status(201).json({ message: '댓글을 등록하였습니다.' })
  } catch (error) {
    return res.status(500).json({ message: '댓글 등록에 실패하였습니다.' })
  }
}

export const editComment = (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId)
    const { postId, content, updatedAt } = req.body
    if (!checkPostID(postId)) {
      return res.status(400).json({ message: '올바르지 않은 post ID 입니다.' })
    }
    const comments = readCommentsFromFile()

    const postComments = comments.comments[postId]

    if (!postComments) {
      return res
        .status(404)
        .json({ message: '해당 포스트에 댓글이 존재하지 않습니다.' })
    }

    const comment = postComments.find((comment) => comment.id === commentId)
    if (comment) {
      comment.content = content
      comment.updateAt = updatedAt
      writeCommentsToFile(comments)
      res.status(200).json({ message: '댓글을 수정하였습니다.' })
    } else {
      return res.status(404).json({ message: '댓글이 존재하지 않습니다.' })
    }
  } catch (error) {
    return res.status(500).json({ message: '댓글 정보를 불러오지 못했습니다.' })
  }
}

export const deleteComment = (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId)
    const { postId } = req.body
    if (!checkPostID(postId)) {
      return res.status(400).json({ message: '올바르지 않은 post ID 입니다.' })
    }
    const comments = readCommentsFromFile()
    const postComments = comments.comments[postId]
    const posts = readPostsFromFile()
    const post = posts.find((post) => post.post_id === postId)

    if (!postComments) {
      return res
        .status(404)
        .json({ message: '해당 포스트에 댓글이 존재하지 않습니다.' })
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

    --post.post_comments
    writePostsToFile(posts)

    res.status(200).json({ message: '댓글을 삭제하였습니다.' })
  } catch (error) {
    return res.status(500).json({ message: '댓글을 삭제하지 못했습니다.' })
  }
}
