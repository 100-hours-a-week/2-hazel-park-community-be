import {
  readPostsFromFile,
  writePostsToFile,
} from '../controllers/post-json-controller.js'
import { readUsersFromFile } from './user-json-controller.js'
import { loadProfileImg } from '../utils/load-profile-img.js'
import path from 'path'
import multer from 'multer'
import conn from '../database/maria.js'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 25 * 1024 * 1024,
    fileSize: 10 * 1024 * 1024,
  },
})

// 게시글 등록
export const uploadPost = (req, res) => {
  upload.single('post_img')(req, res, (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: '게시글 이미지 업로드에 실패했습니다.' })
    }

    try {
      const { title, writer, updated_at, contents } = req.body

      // 입력 값 검증
      if (!title || !writer || !contents) {
        return res
          .status(400)
          .json({ message: '제목, 작성자, 내용을 입력해주세요.' })
      }

      const likes = 0
      const views = 0
      const comments = 0

      // 이미지 파일 처리
      const img = req.file ? req.file.filename : null

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

export const posts = (req, res) => {
  try {
    const posts = readPostsFromFile()
    const users = readUsersFromFile()

    if (posts.length === 0) {
      return res
        .status(200)
        .json({ message: '게시글이 존재하지 않습니다.', data: [] })
    }

    const sortedPosts = [...posts].sort((a, b) => b.post_id - a.post_id)

    const page = parseInt(req.query.page, 10) || 0
    const limit = parseInt(req.query.limit, 10) || 4
    const startIndex = page * limit
    const endIndex = startIndex + limit

    const selectedPosts = sortedPosts.slice(startIndex, endIndex)

    const postWithAuthorInfo = selectedPosts.map((post) => {
      const writer = users.find((user) => user.user_email === post.post_writer)
      const profilePicture = writer?.profile_picture
      const imagePath = profilePicture
        ? path.isAbsolute(profilePicture)
          ? profilePicture
          : path.join('../uploads', profilePicture)
        : null
      const base64Image = imagePath ? loadProfileImg(imagePath) : null

      return {
        ...post,
        post_writer: writer?.user_name || 'Unknown',
        author_profile_picture: base64Image,
      }
    })

    res.status(200).json(postWithAuthorInfo)
  } catch (error) {
    res.status(500).json({ message: '게시글 정보를 불러오지 못했습니다.' })
  }
}

export const postDetail = (req, res) => {
  try {
    const postId = parseInt(req.params.postId)
    const posts = readPostsFromFile()
    const users = readUsersFromFile()

    const post = posts.find((post) => post.post_id === postId)
    if (post) {
      const writer = users.find((user) => user.user_email === post.post_writer)

      const profilePicture = writer?.profile_picture
      const postImg = post.post_img

      const imagePath = profilePicture
        ? path.isAbsolute(profilePicture)
          ? profilePicture
          : path.join('../uploads', profilePicture)
        : null

      const base64Image = imagePath ? loadProfileImg(imagePath) : null

      if (postImg) {
        const postImgPath = path.isAbsolute(postImg)
          ? postImg
          : path.join('../uploads', postImg)

        const postBase64Img = postImgPath ? loadProfileImg(postImgPath) : null

        const postWithAuthorInfo = {
          ...post,
          post_writer: writer.user_name,
          post_img: postBase64Img,
          author_profile_picture: base64Image,
        }

        post.post_views += 1
        writePostsToFile(posts)

        res.status(200).send(postWithAuthorInfo)
      } else {
        ++post.post_views
        writePostsToFile(posts)

        const postWithAuthorInfo = {
          ...post,
          post_writer: writer.user_name,
          author_profile_picture: base64Image,
        }

        post.post_views += 1
        writePostsToFile(posts)

        res.status(200).send(postWithAuthorInfo)
      }
    } else {
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
    }
  } catch (error) {
    res.status(500).json({ message: '게시글 정보를 불러오지 못했습니다.' })
  }
}

export const editPost = (req, res) => {
  upload.single('post_img')(req, res, (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: '게시글 이미지 변경에 실패했습니다.' })
    }
    const postId = parseInt(req.params.postId)
    const { title, content, updated_at } = req.body
    const posts = readPostsFromFile()

    const post = posts.find((post) => post.post_id === postId)
    if (!post) {
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
    }

    post.post_title = title
    post.post_contents = content
    post.post_updated_at = updated_at
    if (req.file) {
      post.post_img = req.file.filename
    }
    writePostsToFile(posts)
    return res.status(200).json({ message: '게시글을 수정하였습니다.' })
  })
}

export const deletePost = (req, res) => {
  try {
    const postId = parseInt(req.params.postId)
    const posts = readPostsFromFile()

    const postIndex = posts.findIndex((post) => post.post_id === postId)
    if (postIndex === -1) {
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
    }

    posts.splice(postIndex, 1)
    writePostsToFile(posts)
    res.status(204).send()
  } catch (error) {
    return res
      .status(500)
      .json({ message: '게시글 정보를 불러오지 못했습니다.' })
  }
}

export const updateLikes = (req, res) => {
  const postId = parseInt(req.params.postId)
  const { is_liked } = req.body
  const posts = readPostsFromFile()

  try {
    const post = posts.find((post) => post.post_id === postId)

    if (!post) {
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
    }

    post.post_likes += is_liked === true ? 1 : -1
    writePostsToFile(posts)
    return res.status(200).send(post)
  } catch (error) {
    return res.status(500).json({ message: '좋아요 업데이트에 실패했습니다.' })
  }
}
