const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Auth Endpoint', function () {
  let db;

  const testUsers = helpers.makeUsersArray();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = helpers.makeKnexInstance();
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  /**
	 * @description Get token for login
	 **/
  describe('{POST} /token', () => {
    beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

    const requiredFields = ['email', 'password'];

    requiredFields.forEach((field) => {
      const loginAttemptBody = {
        email: testUser.email,
        password: testUser.password,
      };

      it(`responds with 400 required error when '${field}' is missing`, () => {
        delete loginAttemptBody[field];

        return supertest(app)
          .post('/api/auth/token')
          .send(loginAttemptBody)
          .expect(400, { error: `Missing '${field}' in request body.` });
      });
    });

    it('responds 400 \'invalid email or password\' when bad email', () => {
      const userInvalidUser = { 
        email: 'email-not', 
        password: 'Password1!' 
      };

      return supertest(app)
        .post('/api/auth/token')
        .send(userInvalidUser)
        .expect(400, { error: 'Incorrect email or password.' });
    });

    it('responds 400 \'invalid email or password\' when bad password', () => {
      const userInvalidPass = { 
        email: testUser.email, 
        password: 'incorrect'
      };
		
      return supertest(app)
        .post('/api/auth/token')
        .send(userInvalidPass)
        .expect(400, { error: 'Incorrect email or password.' });
    });
  });
});
