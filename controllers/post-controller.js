import {
  readPostsFromFile,
  writePostsToFile,
} from '../controllers/post-json-controller.js'

export const uploadPost = (req, res) => {
  const { title, writer, updatedAt, contents, likes, views, comments } =
    req.body
  const posts = readPostsFromFile()
  const postId = posts.length + 1

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
  res.status(201).json({ message: '글을 업로드햇어yo' })
}

export const posts = (req, res) => {
  const posts = readPostsFromFile()
  res.send(posts)
}

export const postDetail = (req, res) => {
  const postId = parseInt(req.params.postId)
  const posts = readPostsFromFile()

  const post = posts.find((post) => post.post_id === postId)
  res.send(post)
}

export const editPost = (req, res) => {
  const postId = parseInt(req.params.postId)
  const { title, content, updatedAt } = req.body
  const posts = readPostsFromFile()

  const post = posts.find((post) => post.post_id === postId)
  if (post) {
    post.post_title = title
    post.post_contents = content
    post.post_updatedAt = updatedAt
    writePostsToFile(posts)
    res.status(200).json({ message: '게시글 수정 성공 야호야호' })
  } else {
    return res.status(404).json({ message: '게시글이 존재하지 않습니다.' })
  }
}
