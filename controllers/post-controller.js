import {
  readPostsFromFile,
  writePostsToFile,
} from '../controllers/post-json-controller.js'
import { readUsersFromFile } from './user-json-controller.js'
import { loadProfileImg } from '../utils/load-profile-img.js'
import path from 'path'

export const uploadPost = (req, res) => {
  try {
    const { title, writer, updatedAt, contents, likes, views, comments } =
      req.body
    const posts = readPostsFromFile()
    const postId = posts.length + 1

    if (!title || !writer || !contents) {
      return res
        .status(400)
        .json({ message: '제목, 작성자, 내용을 입력해주세요.' })
    }

    const newPost = {
      post_id: postId,
      post_title: title,
      post_writer: writer,
      post_updatedAt: updatedAt,
      post_contents: contents,
      post_likes: likes,
      post_views: views,
      post_comments: comments,
    }
    posts.push(newPost)
    writePostsToFile(posts)
    res.status(201).json({ message: '게시글을 업로드 하였습니다.' })
  } catch (error) {
    res.status(500).json({ message: '게시글 업로드에 실패했습니다.' })
  }
}

export const posts = (req, res) => {
  try {
    const posts = readPostsFromFile()
    const users = readUsersFromFile()

    const postWithAuthorInfo = posts.map((post) => {
      const writer = users.find((user) => user.user_name === post.post_writer)

      const profilePicture = writer?.profile_picture

      const imagePath = profilePicture
        ? path.isAbsolute(profilePicture)
          ? profilePicture
          : path.join('../uploads', profilePicture)
        : null

      const base64Image = imagePath ? loadProfileImg(imagePath) : null

      return {
        ...post,
        author_profile_picture: base64Image,
      }
    })

    res.status(200).send(postWithAuthorInfo)
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
      const writer = users.find((user) => user.user_name === post.post_writer)

      const profilePicture = writer?.profile_picture

      const imagePath = profilePicture
        ? path.isAbsolute(profilePicture)
          ? profilePicture
          : path.join('../uploads', profilePicture)
        : null

      const base64Image = imagePath ? loadProfileImg(imagePath) : null

      ++post.post_views
      writePostsToFile(posts)

      const postWithAuthorInfo = {
        ...post,
        author_profile_picture: base64Image,
      }

      post.post_views += 1
      writePostsToFile(posts)

      res.status(200).send(postWithAuthorInfo)
    } else {
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
    }
  } catch (error) {
    res.status(500).json({ message: '게시글 정보를 불러오지 못했습니다.' })
  }
}

export const editPost = (req, res) => {
  try {
    const postId = parseInt(req.params.postId)
    const { title, content, updatedAt } = req.body
    const posts = readPostsFromFile()

    const post = posts.find((post) => post.post_id === postId)
    if (!post) {
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
    }
    post.post_title = title
    post.post_contents = content
    post.post_updatedAt = updatedAt
    writePostsToFile(posts)
    return res.status(200).json({ message: '게시글을 수정하였습니다.' })
  } catch (error) {
    return res
      .status(500)
      .json({ message: '게시글 정보를 불러오지 못했습니다.' })
  }
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
    res.status(200).json({ message: '게시글을 삭제하였습니다.' })
  } catch (error) {
    return res
      .status(500)
      .json({ message: '게시글 정보를 불러오지 못했습니다.' })
  }
}

export const updateLikes = (req, res) => {
  const postId = parseInt(req.params.postId)
  const { isLiked } = req.body
  const posts = readPostsFromFile()

  try {
    const post = posts.find((post) => post.post_id === postId)

    if (!post) {
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
    }

    post.post_likes += isLiked ? 1 : -1
    writePostsToFile(posts)
    return res.status(200).send(post)
  } catch (error) {
    return res.status(500).json({ message: '좋아요 업데이트에 실패했습니다.' })
  }
}
