const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Post = sequelize.define('post', {
    _id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    imageUrl: {
        type: Sequelize.STRING,
        allowNull: false
    },
    content: {
        type: Sequelize.STRING,
        allowNull: false
    },
    creator: {
        type: Sequelize.JSON,
        allowNull: false
    }
});

// Post.associate = function(models) {
//     Post.belongsTo(models.User, {
//       foreignKey: 'user_id',
//       as: 'user',
//       onDelete: 'CASCADE',
//     });
//   };
//   return Post;

module.exports = Post;