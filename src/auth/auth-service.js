const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const authService = {
  //CHECKS WITH DB THE EMAIL
  getUserWithEmail(db, email) {
    return db('users')
      .where({ email })
      .first();
  },

  //COMPARES WRITTEN PASS WITH HASH
  compareUserPasswords(password, hash) {
    return bcrypt.compare(password, hash);
  },

  //JWT AUTH
  createUserJwt(subject, payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      subject,
      expiresIn: config.JWT_EXPIRY,
      algorithm: 'HS256',
    });
  },

  //CHECKS IF JWT IS CORRECT
  verifyUserJwt(token) {
    return jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  },
};

module.exports = authService;