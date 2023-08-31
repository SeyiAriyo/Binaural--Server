const knex = require('knex');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * create a knex instance connected to postgresql
 * @returns {knex instance}
 */
function makeKnexInstance() {
	return knex({
		client: 'pg',
		connection: process.env.TEST_DATABASE_URL,
	});
}

/**
 * create a knex instance connected to postgresql
 * @returns {array} of user objects
 */
function makeUsersArray() {
	return [
		{
			id: 1,
			email: 'test1@email.com',
			name: 'Test user 1',
			password: 'Password1!',
			admin: false,
		},
		{
			id: 2,
			email: 'test2@email.com',
			name: 'Test user 2',
			password: 'Password1!',
			admin: false,
		},
	];
}

/** 
 * make a bearer token with jwt for authorization header
 * @param {object} users - contains `id`, `email`
 * @param {string} secret - used to create the JWT
 * @returns {string} - for HTTP authorization header
 */
function makeAuthHeader(users, secret = process.env.JWT_SECRET) {

	const token = jwt.sign({ id: users.id }, secret, {
		subject: users.email,
		expiresIn: process.env.JWT_EXPIRY,
		algorithm: 'HS256',
	});
	return `Bearer ${token}`;
}

/**
 * remove data from tables and reset sequences for SERIAL id fields
 * @param {knex instance} db
 * @returns {Promise} - when tables are cleared
 */
function cleanTables(db) {
	return db.transaction((trx) =>
		trx
			.raw(
				`TRUNCATE
        "users"`
			)
			.then(() =>
				Promise.all([
					trx.raw(`ALTER SEQUENCE users_id_seq minvalue 0 START WITH 1`),
					trx.raw(`SELECT setval('users_id_seq', 0)`),
				])
			)
	);
}

/**
 * insert users into db with bcrypted passwords and update sequence
 * @param {knex instance} db
 * @param {array} users - array of user objects for insertion
 * @returns {Promise} - when users table seeded
 */
function seedUsers(db, users) {
	const preppedUsers = users.map((user) => ({
		...user,
		password: bcrypt.hashSync(user.password, 1),
	}));
	return db.transaction(async (trx) => {
		await trx.into('users').insert(preppedUsers);

		await trx.raw(`SELECT setval('users_id_seq', ?)`, [
			users[users.length - 1].id,
		]);
	});
}

module.exports = {
	makeKnexInstance,
	makeUsersArray,
	makeAuthHeader,
	cleanTables,
	seedUsers,
};
