import { loadProfileImg } from '../utils/load-profile-img.js'
import path from 'path'
import multer from 'multer'
import conn from '../database/maria.js'
import { uploadImageToS3 } from '../utils/upload-s3.js'

const storage = multer.memoryStorage()

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 25 * 1024 * 1024,
    fileSize: 10 * 1024 * 1024,
  },
})

// 게시글 등록
export const uploadPost = async (req, res) => {
  upload.single('post_img')(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({
          message: '게시글 이미지 업로드에 실패했습니다.',
          error: err.message,
        })
    }

    try {
      const { title, writer, updated_at, contents } = req.body

      if (!title || !writer || !contents) {
        return res
          .status(400)
          .json({ message: '제목, 작성자, 내용을 입력해주세요.' })
      }

      const likes = 0
      const views = 0
      const comments = 0

      let img = null
      if (req.file) {
        try {
          img = await uploadImageToS3(req.file) // 파일 업로드
        } catch (uploadError) {
          console.error('S3 업로드 실패:', uploadError)
          return res
            .status(500)
            .json({ message: '이미지 업로드에 실패했습니다.' })
        }
      }

      const uploadQuery = `
        INSERT INTO POST 
        (title, updated_at, user_email, contents, likes, views, comments, img) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      const queryParams = [
        title,
        updated_at,
        writer,
        contents,
        likes,
        views,
        comments,
        img,
      ]

      conn.query(uploadQuery, queryParams, (error, result) => {
        if (error) {
          console.error(error)
          return res.status(500).json({ message: error.sqlMessage, error })
        }

        res.status(201).json({ message: '게시글을 업로드 하였습니다.' })
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: '게시글 업로드에 실패했습니다.' })
    }
  })
}

// 게시글 조회
export const posts = (req, res) => {
  // 요청된 페이지와 페이지 크기 가져오기 (기본값 설정)
  const page = parseInt(req.query.page, 10) || 0 // 기본 0페이지 (첫 페이지)
  const limit = parseInt(req.query.limit, 10) || 4 // 기본 4개씩 가져오기

  // 데이터베이스에서 가져올 시작 인덱스 계산
  const offset = page * limit

  const postQuery = `
    SELECT 
      p.id AS post_id,
      p.title AS post_title,
      p.updated_at AS post_updated_at,
      u.name AS post_writer,
      p.contents AS post_contents,
      p.likes AS post_likes,
      p.views AS post_views,
      p.comments AS post_comments,
      u.img AS post_img
    FROM POST p
    LEFT JOIN USER u ON p.user_email = u.email
    ORDER BY p.id DESC
    LIMIT ? OFFSET ?;
  `

  const totalCountQuery = `SELECT COUNT(*) AS total FROM POST;`

  // 총 게시글 수 가져오기
  conn.query(totalCountQuery, (countError, countResult) => {
    if (countError) {
      console.error(countError)
      return res.status(500).json({
        message: '총 게시글 수 조회에 실패했습니다.',
        error: countError,
      })
    }

    const totalPosts = countResult[0].total

    // 페이지네이션을 포함한 게시글 데이터 가져오기
    conn.query(postQuery, [limit, offset], (error, results) => {
      if (error) {
        console.error(error)
        return res
          .status(500)
          .json({ message: '게시글 정보를 불러오지 못했습니다.', error })
      }

      if (results.length === 0) {
        return res.status(200).json({
          message: '게시글이 존재하지 않습니다.',
          posts: [],
          pagination: { total: totalPosts, page, limit },
        })
      }

      // 결과 데이터 가공
      const posts = results.map((post) => ({
        id: post.post_id,
        title: post.post_title,
        updated_at: post.post_updated_at,
        writer: post.post_writer || 'Unknown',
        contents: post.post_contents,
        likes: post.post_likes,
        views: post.post_views,
        comments: post.post_comments,
        img: post.post_img
          ? post.post_img.startsWith('http') // S3 URL인지 확인
            ? post.post_img // 이미 S3 URL인 경우 그대로 반환
            : loadProfileImg(`../uploads/${post.post_img}`) // 로컬 파일인 경우
          : null,
      }))

      res.status(200).json({
        message: '게시글 목록 조회 성공',
        posts: posts,
        pagination: { total: totalPosts, page, limit },
      })
    })
  })
}

// 게시글 상세 조회
export const postDetail = (req, res) => {
  const postId = parseInt(req.params.postId)
  const postQuery = `
    SELECT 
      p.id AS post_id,
      p.title AS post_title,
      p.updated_at AS post_updated_at,
      u.name AS post_writer,
      p.contents AS post_contents,
      p.likes AS post_likes,
      p.views AS post_views,
      p.comments AS post_comments,
      p.img AS post_img,
      u.img AS user_img
    FROM POST p
    LEFT JOIN USER u ON p.user_email = u.email
    WHERE p.id = ?
  `

  conn.query(postQuery, [postId], (error, results) => {
    if (error) {
      console.error('게시글 상세 조회 중 오류:', error)
      return res
        .status(500)
        .json({ message: '게시글 조회 중 오류가 발생했습니다.', error })
    }

    if (results.length > 0) {
      const post = results[0]

      // 작성자 프로필 이미지 처리
      post.author_profile_picture = post.user_img
        ? post.user_img.startsWith('http')
          ? post.user_img // S3 URL인 경우 그대로 반환
          : loadProfileImg(path.join('../uploads', post.user_img)) // 로컬 파일인 경우
        : null

      // 게시글 이미지 처리
      post.post_img = post.post_img
        ? post.post_img.startsWith('http')
          ? post.post_img // S3 URL인 경우 그대로 반환
          : loadProfileImg(path.join('../uploads', post.post_img)) // 로컬 파일인 경우
        : null

      // 조회수 업데이트
      const updateViewsQuery = 'UPDATE POST SET views = views + 1 WHERE id = ?'
      conn.query(updateViewsQuery, [postId], (updateError) => {
        if (updateError) {
          console.error('조회수 업데이트 중 오류:', updateError)
          return res.status(500).json({
            message: '조회수 업데이트 중 오류가 발생했습니다.',
            error: updateError,
          })
        }

        // 응답 전송
        res.status(200).json(post)
      })
    } else {
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
    }
  })
}

// 게시글 수정
export const editPost = (req, res) => {
  upload.single('post_img')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        message: '게시글 이미지 변경에 실패했습니다.',
        error: err.message,
      })
    }

    const postId = parseInt(req.params.postId)
    const { title, content, updated_at } = req.body
    let postImg = null

    if (req.file) {
      try {
        postImg = await uploadImageToS3(req.file) // 이미지 업로드 함수 호출
      } catch (uploadError) {
        return res.status(500).json({
          message: '이미지 업로드에 실패했습니다.',
          error: uploadError.message,
        })
      }
    }

    // 이미지를 전달하지 않은 경우 기존 이미지를 유지하기 위해 기존 데이터를 가져옵니다.
    const selectQuery = `
      SELECT img FROM POST WHERE id = ?
    `

    conn.query(selectQuery, [postId], (selectError, selectResults) => {
      if (selectError) {
        console.error('게시글 조회 중 오류:', selectError)
        return res.status(500).json({
          message: '게시글 조회에 실패했습니다.',
          error: selectError.sqlMessage,
        })
      }

      if (selectResults.length === 0) {
        return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
      }

      // 이미지가 없을 경우 기존 이미지를 유지
      postImg = postImg || selectResults[0].img

      const updateQuery = `
        UPDATE POST
        SET title = ?, contents = ?, updated_at = ?, img = ?
        WHERE id = ?
      `

      conn.query(
        updateQuery,
        [title, content, updated_at, postImg, postId],
        (updateError, results) => {
          if (updateError) {
            console.error('게시글 수정 중 오류:', updateError)
            return res.status(500).json({
              message: '게시글 수정에 실패했습니다.',
              error: updateError.sqlMessage,
            })
          }

          if (results.affectedRows === 0) {
            return res
              .status(404)
              .json({ message: '게시글이 존재하지 않습니다.' })
          }

          res.status(200).json({ message: '게시글을 수정하였습니다.' })
        },
      )
    })
  })
}

// 게시글 삭제
export const deletePost = (req, res) => {
  const postId = parseInt(req.params.postId)

  const deleteQuery = 'DELETE FROM POST WHERE id = ?'

  conn.query(deleteQuery, [postId], (error, result) => {
    if (error) {
      console.error(error)
      return res.status(500).json({ message: error.sqlMessage, error })
    }

    // affectedRows가 0이면 게시글이 존재하지 않음
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
    }

    // 성공적으로 삭제된 경우
    res.status(204).send()
  })
}

// 게시글 좋아요
export const updateLikes = (req, res) => {
  const postId = parseInt(req.params.postId) // 요청에서 postId 가져오기
  const { is_liked } = req.body // 요청에서 is_liked 값 가져오기

  if (typeof is_liked !== 'boolean') {
    return res.status(400).json({ message: 'is_liked 값이 올바르지 않습니다.' })
  }

  const updateQuery = 'UPDATE POST SET likes = likes + ? WHERE id = ?'
  const selectQuery = 'SELECT * FROM POST WHERE id = ?'
  const changeValue = is_liked ? 1 : -1 // is_liked에 따라 +1 또는 -1 설정

  // 데이터베이스 업데이트
  conn.query(updateQuery, [changeValue, postId], (error, updateResult) => {
    if (error) {
      console.error('좋아요 업데이트 실패:', error)
      return res
        .status(500)
        .json({ message: '좋아요 업데이트에 실패했습니다.' })
    }

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
    }

    // 업데이트 후 최신 데이터 가져오기
    conn.query(selectQuery, [postId], (selectError, selectResult) => {
      if (selectError) {
        console.error('좋아요 조회 실패:', selectError)
        return res
          .status(500)
          .json({ message: '업데이트된 데이터를 조회할 수 없습니다.' })
      }

      if (selectResult.length === 0) {
        return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
      }

      const post = selectResult[0]
      const response = {
        post_title: post.title,
        post_writer: post.writer,
        post_updated_at: post.updated_at,
        post_contents: post.contents,
        post_likes: post.likes,
        post_views: post.views,
        post_comments: post.comments,
        post_img: post.img,
      }

      return res.status(200).json(response) // 업데이트된 게시글 반환
    })
  })
}
