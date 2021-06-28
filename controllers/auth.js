const User = require('../models/user');

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator/check');
const jwt = require('jsonwebtoken');

exports.signup = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const { name, email, password } = req.body;

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            return User.create({
                name: name,
                email: email,
                password: hashedPassword,
                status: 'I am New!'
            })
        })
        .then(result => {
            res.status(200).json({ message: 'User created!', userId: result._id });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }

            next(err);
        })
}

exports.login = (req, res, next) => {
    const { email, password } = req.body;

    let loadedUser;

    User.findOne({ where: { email: email } })
        .then(user => {
            if (!user) {
                const error = new Error('User nopt found with this Email!');
                error.statusCode = 401;
                throw error;
            }

            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password!');
                error.statusCode = 401;
                throw error;
            }
            // creating a json web token
            const token = jwt.sign({
                email: loadedUser.email,
                userId: loadedUser._id.toString()
            }, 'secret', { expiresIn: '1h' });

            res.status(200).json({ token: token, userId: loadedUser._id.toString() })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.getUserStatus = (req, res, next) => {
    User.findByPk(req.userId)
        .then(user => {
            if (!user) {
                const error = new Error('User not found!');
                error.statusCode = 404;
                throw error;
            }

            res.status(200).json({ status: user.status });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.updateUserStatus = (req, res, next) => {
    const newStatus  = req.body.status;
    User.findByPk(req.userId)
        .then(user => {
            if (!user) {
                const error = new Error('User not found!');
                error.statusCode = 404;
                throw error;
            }

            user.status = newStatus;
            return user.save();
        })
        .then(result => {
            res.status(200).json({ status: result.status });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next();
        })
}