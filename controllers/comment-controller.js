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
  ORDER BY c.updated_at ASC
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

// 댓글 등록
export const uploadComment = (req, res) => {
  try {
    const postId = parseInt(req.params.postId)
    const { writer, updated_at, content } = req.body

    // Post ID 유효성 확인
    const checkPostQuery = 'SELECT id FROM POST WHERE id = ?'
    conn.query(checkPostQuery, [postId], (checkError, checkResults) => {
      if (checkError) {
        console.error('Post ID 확인 중 오류:', checkError)
        return res.status(500).json({ message: '댓글 등록에 실패하였습니다.' })
      }

      if (checkResults.length === 0) {
        return res
          .status(400)
          .json({ message: '올바르지 않은 post ID 입니다.' })
      }

      // 댓글 삽입
      const insertCommentQuery = `
        INSERT INTO COMMENT (post_id, user_email, updated_at, contents)
        VALUES (?, ?, ?, ?)
      `
      conn.query(
        insertCommentQuery,
        [postId, writer, updated_at, content],
        (insertError, insertResults) => {
          if (insertError) {
            console.error('댓글 등록 중 오류:', insertError)
            return res
              .status(500)
              .json({ message: '댓글 등록에 실패하였습니다.' })
          }

          // 게시글 댓글 수 증가
          const updatePostQuery = `
          UPDATE POST
          SET comments = comments + 1
          WHERE id = ?
        `
          conn.query(updatePostQuery, [postId], (updateError) => {
            if (updateError) {
              console.error('댓글 수 업데이트 중 오류:', updateError)
              return res
                .status(500)
                .json({ message: '댓글 등록에 실패하였습니다.' })
            }

            // 응답 전송
            res.status(201).json({ message: '댓글을 등록하였습니다.' })
          })
        },
      )
    })
  } catch (error) {
    console.error('댓글 등록 중 예외 발생:', error)
    return res.status(500).json({ message: '댓글 등록에 실패하였습니다.' })
  }
}

// 댓글 수정
export const editComment = (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId)
    const { postId, content, updated_at } = req.body

    // Post ID 유효성 확인
    const checkPostQuery = 'SELECT id FROM POST WHERE id = ?'
    conn.query(checkPostQuery, [postId], (checkError, checkResults) => {
      if (checkError) {
        console.error('Post ID 확인 중 오류:', checkError)
        return res.status(500).json({ message: '댓글 수정을 실패하였습니다.' })
      }

      if (checkResults.length === 0) {
        return res
          .status(400)
          .json({ message: '올바르지 않은 post ID 입니다.' })
      }

      // 댓글 유효성 확인
      const checkCommentQuery =
        'SELECT id FROM COMMENT WHERE id = ? AND post_id = ?'
      conn.query(
        checkCommentQuery,
        [commentId, postId],
        (commentError, commentResults) => {
          if (commentError) {
            console.error('댓글 확인 중 오류:', commentError)
            return res
              .status(500)
              .json({ message: '댓글 수정을 실패하였습니다.' })
          }

          if (commentResults.length === 0) {
            return res
              .status(404)
              .json({ message: '댓글이 존재하지 않습니다.' })
          }

          // 댓글 수정
          const updateCommentQuery = `
          UPDATE COMMENT
          SET contents = ?, updated_at = ?
          WHERE id = ? AND post_id = ?
        `
          conn.query(
            updateCommentQuery,
            [content, updated_at, commentId, postId],
            (updateError) => {
              if (updateError) {
                console.error('댓글 수정 중 오류:', updateError)
                return res
                  .status(500)
                  .json({ message: '댓글 수정을 실패하였습니다.' })
              }

              res.status(200).json({ message: '댓글을 수정하였습니다.' })
            },
          )
        },
      )
    })
  } catch (error) {
    console.error('댓글 수정 중 예외 발생:', error)
    return res.status(500).json({ message: '댓글 정보를 불러오지 못했습니다.' })
  }
}

// 댓글 삭제
export const deleteComment = (req, res) => {
  const postId = parseInt(req.params.postId)
  const commentId = parseInt(req.params.commentId)

  const deleteQuery = 'DELETE FROM COMMENT WHERE id = ? AND post_id = ?'

  conn.query(deleteQuery, [commentId, postId], (error, result) => {
    if (error) {
      console.error(error)
      return res.status(500).json({ message: error.sqlMessage, error })
    }

    // affectedRows가 0이면 댓글이 존재하지 않음
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '댓글이 존재하지 않습니다.' })
    }

    // 게시글 댓글 수 감소
    const updatePostQuery = `
    UPDATE POST
    SET comments = comments - 1
    WHERE id = ?
  `
    conn.query(updatePostQuery, [postId], (updateError) => {
      if (updateError) {
        console.error('댓글 수 업데이트 중 오류:', updateError)
        return res.status(500).json({ message: '댓글 등록에 실패하였습니다.' })
      }
    })

    // 성공적으로 삭제된 경우
    res.status(204).send()
  })
}
