const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const Post = require('../models/post');
const User = require('../models/user');
const { post } = require('../routes/feed');

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;

  Post.findAndCountAll()
    .then(pageCount => {
      totalItems = pageCount.count;
      return Post.findAll({
        offset: (currentPage - 1) * perPage,
        limit: perPage
      })
    })
    .then(posts => {
      res.status(200).json({
        message: 'Fetched all posts!',
        posts: posts,
        totalItems: totalItems
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
};

exports.createPost = (req, res, next) => {
  // create post in db

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed! Please check the required fields!');
    error.statusCode = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error('No image provided!');
    error.statusCode = 422;
    throw error;
  }

  const { title, content } = req.body;
  // const imageUrl = req.file.path;
  const imageUrl = req.file.path.replace("\\", "/");
  let creator;

  User.findByPk(req.userId)
    .then(user => {
      creator = user;

      const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: user,
        userId: user._id
      })
      post.save()
        .then(result => {
          res.status(201).json({
            message: 'Post created Successfully!',
            post: post,
            creator: { _id: creator._id, name: creator.name }
          })
        })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findByPk(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find the post!');
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({
        message: 'Post festched',
        post: post
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed! Please check the required fields!');
    error.statusCode = 422;
    throw error;
  }

  const { title, content } = req.body;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/");
  }

  if (!imageUrl) {
    const error = new Error('No file found!');
    error.statusCode = 422;
    throw error;
  }

  Post.findByPk(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Post not found!');
        error.statusCode = 500;
        throw error;
      }

      if (post.creator._id !== parseInt(req.userId)) {
        const error = new Error('Not Authorized');
        error.statusCode = 403;
        throw error;
      }

      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;

      return post.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Updated Successfully!', post: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findByPk(postId)
    .then(post => {
      //check logged in user
      if (!post) {
        const error = new Error('Post not found!');
        error.statusCode = 500;
        throw error;
      }

      if (post.creator._id !== parseInt(req.userId)) {
        const error = new Error('Not Authorized');
        error.statusCode = 403;
        throw error;
      }

      clearImage(post.imageUrl);
      return post.destroy();
    })
    .then(result => {
      res.status(200).json({ message: 'Post deleted!' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
}
