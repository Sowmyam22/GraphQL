const Sequelize = require('sequelize');

const sequelize = new Sequelize(
    'rest-api', 'root', 'Dhruvareddy@123', {
    dialect: 'mysql',
    host: 'localhost'
})

module.exports = sequelize;