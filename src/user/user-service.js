const bcrypt = require('bcryptjs');
const xss = require('xss');

//SPECIAL CHARACTERS TO PASSWORD VALIDATION
const passValidation = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&])[\S]+/;
const userEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const UserService = {
  getAllUsers(db) {
    return db.select('*').from('users');
  },

  getUserById(db,id) {
    return db.select('*').from('users').where({id}).first();
  },

  deleteUser(db, id) {
    return db('users').where({ id }).delete();
  },

  //UPDATE USER PASSWORD
  updateUser(db, id, updatedFields) {
    return db('users').where({ id }).update(updatedFields);
  },

  //ADDING A NEW USER
  addUser(db, newUser) {
    return db
      .insert(newUser)
      .into('users')
      .returning('*')
      .then((row) => row[0]);
  },

  //PASSWORD VALIDATION
  passValidation(password) {
    if (password.length < 6) {
      return 'Password needs to be longer than 6 characters.';
    }
    if (password.length > 12) {
      return 'Password needs to be shorter than 12 characters.';
    }
    if (password.startsWith(' ') || password.endsWith(' ')) {
      return 'Password must not have empty spaces.';
    }
    if (!passValidation.test(password)) {
      return 'Password must contain one upper case, a lower case, a number and a special character';
    }
    return null;
  },

  //HASHING THE PASS. USING BCRYPT
  passHash(password) {
    return bcrypt.hash(password, 12);
  },

  //XSS TO PROTECT AGAINST SCRIPT ATTACKS
  serializeUser(user) {
    return {
      id: user.id,
      email: xss(user.email),
      name: xss(user.name),
      password: xss(user.password),
      admin: user.admin,
      user_prefs: xss(user.user_prefs)
    };
  },

  //CHECKS FOR UNIQUE EMAIL
  emailExists(db, email) {
    return db('users')
      .where({ email })
      .first()
      .then((email) => !!email);
  },

  //NAME LENGTH VALIDATION
  nameValidation(name) {
    if (name.length === 0) {
      return 'The name field is required.';
    }
    if (name.length > 25) {
      return 'Name has too many characters.';
    }
    return null;
  },

  //EMAIL VALIDATION
  emailValidation(email) {
    if (!userEmail.test(email)) {
      return 'Email is invalid. Your email should be example@provider.com .';
    }
    return null;
  },
};

module.exports = UserService;
