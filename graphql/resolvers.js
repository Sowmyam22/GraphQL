const bcrypt = require('bcryptjs');

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
  }
}