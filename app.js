const path = require('path');
const fs = require('fs');

const express = require('express');
// const bodyParser = require('body-parser');

/** Multer is a node.js middleware for handling multipart/form-data, which is primarily used for uploading files. **/
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { graphqlHTTP } = require('express-graphql');

const sequelize = require('./util/database');
const User = require('./models/user');
const Post = require('./models/post');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');

const app = express();

// disk storage engine gives full control on storing files to disk
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },

  filename: (req, file, cb) => {
    // cb(null, new Date().toISOString() + '-' + file.originalname); // genrates the CORS Error
    cb(null, uuidv4());
  }
});

// Function to control which files are accepted
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.use(express.json()); //application/json

//registering the multer
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
})

app.use(auth);

app.put('/post-image', (req, res, next) => {
  if (!req.isAuth) {
    throw new Error('Not Authenticated!');
  }

  if (!req.file) {
    return res.status(200).json({ message: 'No file found!' });
  }

  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }

  return res.status(201).json({ message: 'File stored!', filePath: req.file.path });
})

app.use('/graphql', graphqlHTTP({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  formatError(err) {
    if (!err.originalError) {
      return err;
    }
    const data = err.originalError.data;
    const message = err.message || 'An error occurred!';
    const code = err.originalError.code || 500;
    return { message: message, status: code, data: data };
  }
}));

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;

  res.status(status).json({
    message: message,
    data: data
  });
})

Post.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(Post);

// sequelize.sync({ force: true })    // used to override the tables in the database
sequelize.sync()
  .then(result => {
    app.listen(8080);
  })
  .catch(err => console.log(err))

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
}
