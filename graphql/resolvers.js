const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');
const { clearImage } = require('../util/file');

// module.exports = {
//   hello() {
//     return {
//       text: 'Hello World!',
//       views: 123
//     }
//   }
// }

//resolver for the mutation

module.exports = {
  // createUser(args, req) {
  //   const email = args.userInput.email;
  // }

  // if not using async await then we should return it when then and catch blocks are used

  createUser: async function ({ userInput }, req) {
    // Input validation
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'Invalid E-Mail!' });
    }

    if (validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: 'Invalid Password!' });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid Input!');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = await User.findOne({ where: { email: userInput.email } });

    if (existingUser) {
      const error = new Error('User already exists!');
      throw error;
    }

    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw,
    });

    const createdUser = await user.save();
    return { _id: createdUser._id, email: createdUser.email }
  },

  login: async function ({ email, password }) {
    // find the user
    const user = await User.findOne({ where: { email: email } });

    // check if user exists
    if (!user) {
      const error = new Error('User Not Found!');
      error.code = 401;
      throw error;
    }

    // if user exists check for password
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Invalid Password');
      error.code = 401;
      throw error;
    }

    const token = jwt.sign({
      userId: user._id,
      email: user.email
    }, 'secret', { expiresIn: '1h' });

    return { token: token, userId: user._id };
  },

  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('User not Authenticated!');
      error.code = 401;
      throw error;
    }

    const errors = [];
    if (validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is Invalid!' });
    }

    if (validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is Invalid!' });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid Input!');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    // get the user from db

    const user = await User.findByPk(req.userId)

    if (!user) {
      const error = new Error('Invalid User!');
      error.code = 401;
      throw error;
    }

    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user
    });

    const createdPost = await post.save();
    // add post to users posts
    /** 
     *  user.posts.push(createdPost);
     *  await user.save();
     **/
    return {
      _id: createdPost._id,
      title: createdPost.title,
      content: createdPost.content,
      imageUrl: createdPost.imageUrl,
      creator: createdPost.creator,
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString()
    }
  },

  posts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error('User not Authenticated!');
      error.code = 401;
      throw error;
    }

    // pagination
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.findAndCountAll();
    const posts = await Post.findAll({
      offset: (page - 1) * perPage,
      limit: perPage
    });

    return {
      posts: posts.map(post => {
        return {
          _id: post._id,
          title: post.title,
          content: post.content,
          creator: post.creator,
          imageUrl: post.imageUrl,
          createdAt: post.createdAt.toISOString(),
        }
      }), totalPosts: totalPosts.count
    }
  },

  post: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('User not Authenticated!');
      error.code = 401;
      throw error;
    }

    const post = await Post.findByPk(id);

    if (!post) {
      const error = new Error('No Post Found!')
      error.code = 404;
      throw error;
    }

    return {
      _id: post._id,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      creator: post.creator,
      createdAt: post.createdAt.toISOString()
    }
  },

  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('User not Authenticated!');
      error.code = 401;
      throw error;
    }

    const post = await Post.findByPk(id);
    if (!post) {
      const error = new Error('No Post Found!')
      error.code = 404;
      throw error;
    }
    if (post.creator._id !== req.userId) {
      const error = new Error('Not Authorized');
      error.code = 403;
      throw error;
    }

    const errors = [];
    if (validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is Invalid!' });
    }

    if (validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is Invalid!' });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid Input!');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    post.title = postInput.title;
    post.content = postInput.content;
    if (post.imageUrl !== 'undefined') {
      post.imageUrl = postInput.imageUrl;
    }

    const updatedPost = await post.save();
    return {
      _id: updatedPost._id,
      title: updatedPost.title,
      content: updatedPost.content,
      imageUrl: updatedPost.imageUrl,
      creator: updatedPost.creator,
      createdAt: updatedPost.createdAt.toISOString(),
    }
  },

  deletePost: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('User not Authenticated!');
      error.code = 401;
      throw error;
    }

    const post = await Post.findByPk(id);
    if (!post) {
      const error = new Error('No Post Found!')
      error.code = 404;
      throw error;
    }

    if (post.creator._id !== req.userId) {
      const error = new Error('Not Authorized');
      error.code = 403;
      throw error;
    }

    clearImage(post.imageUrl);

    await post.destroy();

    // to delete the id from the posts array in users table
    /**
     * const user = await User.findByPk(req.userId);
     * user.posts.pull(id);
     * await user.save();
     */

    return true;
  },

  user: async function (args, req) {
    if (!req.isAuth) {
      const error = new Error('User not Authenticated!');
      error.code = 401;
      throw error;
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      const error = new Error('No User Found!')
      error.code = 404;
      throw error;
    }

    return { status: user.status }
  },

  updateStatus: async function ({ status }, req) {
    if (!req.isAuth) {
      const error = new Error('User not Authenticated!');
      error.code = 401;
      throw error;
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      const error = new Error('No User Found!')
      error.code = 404;
      throw error;
    }

    user.status = status;
    await user.save();

    return { status: user.status }
  }
}