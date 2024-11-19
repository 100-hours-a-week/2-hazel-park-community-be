import {
  readCommentsFromFile,
  writeCommentsToFile,
} from './comment-json-controller.js'

import { readPostsFromFile, writePostsToFile } from './post-json-controller.js'
import { readUsersFromFile } from './user-json-controller.js'

import path from 'path'
import { loadProfileImg } from '../utils/load-profile-img.js'
import conn from '../database/maria.js'

function checkPostID(postId) {
  if (postId <= 0) {
    return false
  }
  return true
}

// 댓글 조회
export const comments = (req, res) => {
  const postId = parseInt(req.params.postId)
  if (!checkPostID(postId)) {
    return res.status(400).json({ message: '올바르지 않은 post ID 입니다.' })
  }

  // 요청된 페이지와 페이지 크기 가져오기 (기본값 설정)
  const page = parseInt(req.query.page, 10) || 0 // 기본 0페이지 (첫 페이지)
  const limit = parseInt(req.query.limit, 10) || 2 // 기본 2개씩 가져오기

  // 데이터베이스에서 가져올 시작 인덱스 계산
  const offset = page * limit

  const commentQuery = `
  SELECT 
    c.id,
    u.name,
    c.updated_at,
    c.contents,
    u.img
  FROM COMMENT c
  LEFT JOIN USER u ON c.user_email = u.email
  ORDER BY c.updated_at DESC
  LIMIT ? OFFSET ?;
`

  conn.query(commentQuery, [limit, offset], (error, results) => {
    if (error) {
      console.error(error)
      return res
        .status(500)
        .json({ message: '댓글 조회에 실패했습니다.', error })
    }

    if (results.length === 0) {
      return res.status(200).json({
        message: '댓글이 존재하지 않습니다.',
        comments: [],
      })
    }

    const comments = results.map((comment) => ({
      id: comment.id,
      writer: comment.name,
      updated_at: comment.updated_at,
      content: comment.contents,
      author_profile_picture: comment.img
        ? loadProfileImg(`../uploads/${comment.img}`)
        : null,
    }))

    res.status(200).json(comments)
  })
}

export const uploadComment = (req, res) => {
  try {
    const postId = parseInt(req.params.postId)
    const { writer, updated_at, content } = req.body
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
      updated_at: updated_at,
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
    const { postId, content, updated_at } = req.body
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
      comment.updated_at = updated_at
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
    const postId = parseInt(req.params.postId)
    const commentId = parseInt(req.params.commentId)
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

    res.status(204).send()
  } catch (error) {
    return res.status(500).json({ message: '댓글을 삭제하지 못했습니다.' })
  }
}
