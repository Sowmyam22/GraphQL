const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

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
  }
}