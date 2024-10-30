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
