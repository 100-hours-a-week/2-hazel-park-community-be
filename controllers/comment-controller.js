import {
  readCommentsFromFile,
  writeCommentsToFile,
} from './comment-json-controller.js'

import { readPostsFromFile, writePostsToFile } from './post-json-controller.js'
import { readUsersFromFile } from './user-json-controller.js'

import path from 'path'
import { loadProfileImg } from '../utils/load-profile-img.js'

// [jeff] 이거 한큐에 갈 수 있습니다.
// function checkPostID(postId) {
//  if (postId <= 0) {
//    return false
//  }
//  return true
// }

/**
 * 
 * 주어진 postId 값이 유효한지 확인함
 * 양의 정수인지 확인
 * 
 *  true: 정수이며 양수
 *  false: 그 외
 * 
 */
function isValidPostId(postId){ 
  return Number.isInteger(postId) && postId > 0
}

// [jeff] getComments 와 같이 명확한 이름을 사용할 것!
// export const comments = (req, res) => {
export const getComments = (req, res) => {
  const postId = parseInt(req.params.postId)
  if (!checkPostID(postId)) {
    return res.status(400).json({ message: '올바르지 않은 post ID 입니다.' })
  }
  const comments = readCommentsFromFile()
  const users = readUsersFromFile()

  try {
    const postComments = comments.comments[postId]

    const page = parseInt(req.query.page, 10) || 0
    const limit = parseInt(req.query.limit, 10) || 2
    const startIndex = page * limit
    const endIndex = startIndex + limit

    const selectedComments = postComments.slice(startIndex, endIndex)

    if (selectedComments) {
      const commentsWithAuthorInfo = selectedComments.map((comment) => {
        const writer = users.find((user) => user.user_email === comment.writer)

        const profilePicture = writer?.profile_picture

        const imagePath = profilePicture
          ? path.isAbsolute(profilePicture)
            ? profilePicture
            : path.join('../uploads', profilePicture)
          : null

        const base64Image = imagePath ? loadProfileImg(imagePath) : null

        return {
          ...comment,
          writer: writer.user_name,
          author_profile_picture: base64Image,
        }
      })
      res.status(200).json(commentsWithAuthorInfo)
    } else {
      res.status(200).json({ message: '댓글이 존재하지 않습니다.', data: null })
    }
  } catch (error) {
    res.status(500).json({ message: '댓글 조회에 실패했습니다.' })
  }
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
