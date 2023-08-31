const { JsonWebTokenError } = require('jsonwebtoken');
const authService = require('../auth/auth-service');

async function requireAuth(req, res, next) {
	const authToken = req.get('Authorization') || '';

	let bearerToken;

	//CHECKS TO IF THERE IS A BEARER TOKEN
	if (!authToken.toLowerCase().startsWith('bearer ')) {
		return res.status(401).json({ error: 'Missing bearer token.' });
	} else {
		bearerToken = authToken.slice(7, authToken.length);
	}

	try {
		const payload = authService.verifyUserJwt(bearerToken);

		const user = await authService.getUserWithEmail(
			req.app.get('db'),
			payload.sub
		);

		//CHECKS IF IT IS THE CORRECT USER
		if (!user) return res.status(401).json({ error: 'Unauthorized request.' });

		req.user = user;
		next();
	} catch (error) {
		if (error instanceof JsonWebTokenError)
			return res.status(401).json({ error: 'Unauthorized request.' });

		next(error);
	}
}

module.exports = {
	requireAuth,
};
