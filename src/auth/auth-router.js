const express = require('express');
const authService = require('./auth-service');
const { requireAuth } = require('../middleware/jwt-auth');
const authRouter = express.Router();
const jsonBodyParser = express.json();
const logs = require('../logs');

authRouter
	.route('/token')
	.post(jsonBodyParser, async (req, res, next) => {
		const { email, password } = req.body;
		const loginUser = { email, password };

		//VALIDATION FOR REQUIRED FIELDS
		for (const [key, value] of Object.entries(loginUser))
			if (value == null)
				return res.status(400).json({
					error: `Missing '${key}' in request body.`,
				});

		try {
			//CHECKING IF CORRECT EMAIL
			const dbUser = await authService.getUserWithEmail(
				req.app.get('db'),
				loginUser.email
			);

			if (!dbUser)
				return res.status(400).json({
					error: 'Incorrect email or password.',
				});
			//CHECKING IF CORRECT PASSWORD
			const compareMatch = await authService.compareUserPasswords(
				loginUser.password,
				dbUser.password
			);

			if (!compareMatch)
				return res.status(400).json({
					error: 'Incorrect email or password.',
				});

			// JWT AUTH
			const sub = dbUser.email;
			const payload = {
				id: dbUser.id,
				name: dbUser.name,
				admin: dbUser.admin,
				create_date: dbUser.create_date,
			};
			res.send({
				authToken: authService.createUserJwt(sub, payload),
			});
		} catch (error) {
			next(error);
		}
	})
	.put(requireAuth, (req, res) => {
		const sub = req.user.email;
		const payload = {
			id: req.user.id,
			name: req.user.name,
		};
		res.send({
			authToken: authService.createUserJwt(sub, payload),
		});
	});
module.exports = authRouter;
