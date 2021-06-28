const { ABSTRACT } = require('sequelize');
const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const User = sequelize.define('user', {
    _id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'I am new!'
    },
    // myPosts: { 
    //     type: Sequelize.STRING, 
    //     get: function() {
    //         return JSON.parse(this.getDataValue('posts'));
    //     }, 
    //     set: function(val) {
    //         return this.setDataValue('posts', JSON.stringify(val));
    //     }
    // }
});

// User.associate = function(models) {
//     User.hasMany(models.Post, {
//       foreignKey: 'user_id',
//       as: 'post',
//     });
//   };
//   return User;

module.exports = User;