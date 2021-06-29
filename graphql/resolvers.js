const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

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
          createdAt: post.createdAt.toISOString(),
        }
      }), totalPosts: totalPosts.count
    }
  }
}