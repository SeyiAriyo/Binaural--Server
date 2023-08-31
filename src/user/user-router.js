const express = require('express');
const UserService = require('./user-service');
const { requireAuth } = require('../middleware/jwt-auth');
const bodyParser = express.json();
const logs = require('../logs');
const path = require('path');
const { serializeUser } = require('./user-service');

const userRouter = express.Router();

userRouter
  .route('/')
  .get(requireAuth, (req, res, next) => {
    UserService.getAllUsers(req.app.get('db'))
      .then((users) => {
        res.status(200).json(users);
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const trimUser = {
      name: req.body.name,
      password: req.body.password,
      email: req.body.email,
    };

    //VALIDATION FOR REQUIRED FIELDS
    for (const field of ['name', 'password', 'email'])
      if (!trimUser[field] || trimUser[field] === undefined) {
        logs.error(`User ${field} is required.`);
        return res
          .status(400)
          .json({ error: `The ${field} field is required.` });
      }

    //VALIDATION WHEN USER USES NAME WITH SPACES BEFORE AND AFTER
    trimUser.name = trimUser.name.trim().replace(/\s+/g, ' ');

    //PASSWORD VALIDATION
    const passError = UserService.passValidation(trimUser.password);

    if (passError) {
      logs.error(passError);
      return res.status(400).json({ error: passError });
    }

    //NAME VALIDATION
    const nameError = UserService.nameValidation(trimUser.name);

    if (nameError) {
      logs.error(nameError);
      return res.status(400).json({ error: nameError });
    }

    //EMAIL VALIDATION
    const emailError = UserService.emailValidation(trimUser.email);

    if (emailError) {
      logs.error(emailError);
      return res.status(400).json({ error: emailError });
    }

    //ADDING USER VALIDATION
    UserService.emailExists(req.app.get('db'), trimUser.email)
      .then((validReg) => {
        if (validReg) {
          logs.error('Email already exists.');
          return res
            .status(400)
            .json({ error: 'Email already exists. Try again.' });
        }

        return UserService.passHash(trimUser.password).then((hashedPass) => {
          trimUser.password = hashedPass;

          return UserService.addUser(req.app.get('db'), trimUser).then(
            (user) => {
              logs.info(
                `User created successfully. The user id is: ${user.id}.`
              );
              res
                .status(201)
                .location(
                  path.posix.join(
                    req.originalUrl, 
                    `/${user.id}`
                  )
                )
                .json(serializeUser(user));
            }
          );
        });
      })
      .catch(next);
  });

userRouter
  .route('/:id')
  .all(requireAuth)
  .get((req,res,next) => {
    const {id} = req.params;
    UserService.getUserById(req.app.get('db'),id)
      .then((user) => {
        if(!user){
          return res.status(400).json({ error: { message: 'User not found/does not exist' } });
        }
        return res.status(200).json(serializeUser(user));
      })
      .catch(next);
  })
  .delete(bodyParser, (req, res, next) => {
    const id = req.params.id;
    UserService.deleteUser(req.app.get('db'), id)
      .then((user) => {
        if (!user) {
          return res
            .status(400)
            .json({ error: { message: 'User not found/does not exist' } });
        }
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const {password, user_prefs} = req.body;    
    
    //If updating user preferences
    if(user_prefs){
      UserService.updateUser(
        req.app.get('db'),
        req.params.id,
        {user_prefs}
      )
        .then(() => {          
          logs.info(
            `User ${req.params.id}: User prefs updated successfully.`
          );
          res.status(204).end();
        })        
        .catch((err) => {
          res.status(409).json({ error: err });
        });


    //If updating password
    } else {    

      const trimUpdateUser = {
        id: req.params.id,
        password: req.body.password,
      };

      //VALIDATION PASSWORD REQUIRED
      for (const field of ['password'])
        if (!trimUpdateUser[field]) {
          logs.error(`The ${field} is required.`);
          return res.status(400).json({ error: `The ${field} is required.` });
        }

      //CONST CALLING PASSWORD VALIDATION - User-service.js
      const passError = UserService.passValidation(trimUpdateUser.password);
      if (passError) {
        logs.error(passError);
        return res.status(400).json({ error: passError });
      }

      //UPDATE USER VALIDATION - User-service.js
      UserService.passHash(trimUpdateUser.password)
        .then((hashedPass) => {
          trimUpdateUser.password = hashedPass;
          UserService.updateUser(
            req.app.get('db'),
            trimUpdateUser.id,
            trimUpdateUser
          )
            .then(() => {
              if (trimUpdateUser.password) {
                logs.info(
                  `User ${trimUpdateUser.id}: password was updated successfully.`
                );
                res.status(204).end();
              }
            })
            .catch((err) => {
              res.status(409).json({ error: err });
            });
        });
    }
    next;
  });
  

module.exports = userRouter;
