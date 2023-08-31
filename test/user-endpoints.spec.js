const bcrypt = require('bcryptjs');
const app = require('../src/app');
const helpers = require('./test-helpers');
const jwt = require('jsonwebtoken');

describe('User Endpoints', function () {
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
	 * @description Register a user and populate their fields
	 **/
  describe('{POST} /api/user', () => {
    beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

    const requiredFields = ['name', 'password', 'email'];

    requiredFields.forEach((field) => {
      const registerAttemptBody = {
        name: 'Name',
        password: 'Test1!',
        email: 'example@email.com',
      };

      it(`responds with 400 required error when '${field}' is missing`, () => {
        delete registerAttemptBody[field];

        return supertest(app)
          .post('/api/user')
          .send(registerAttemptBody)
          .expect(400, { error: `The ${field} field is required.` });
      });
    });

    it('responds 400 \'Password be longer than 6 characters\'', () => {
      const userShortPassword = {
        email: 'test email',
        password: '1234',
        name: 'test name',
      };

      return supertest(app)
        .post('/api/user')
        .send(userShortPassword)
        .expect(400, { error: 'Password needs to be longer than 6 characters.' });
    });

    it('responds 400 \'Password be less than 12 characters\' when long password', () => {
      const userLongPassword = {
        email: 'test email',
        password: '*'.repeat(45),
        name: 'test name',
      };

      return supertest(app)
        .post('/api/user')
        .send(userLongPassword)
        .expect(400, { error: 'Password needs to be shorter than 12 characters.' });
    });

    it('responds 400 error when password starts with spaces', () => {
      const userPasswordStartsSpaces = {
        email: 'test email',
        password: ' 1Aa!2Bb@',
        name: 'test name',
      };

      return supertest(app)
        .post('/api/user')
        .send(userPasswordStartsSpaces)
        .expect(400, { error: 'Password must not have empty spaces.' });
    });

    it('responds 400 error when password ends with spaces', () => {
      const userPasswordEndsSpaces = {
        email: 'test email',
        password: '1Aa!2Bb@ ',
        name: 'test name',
      };
      return supertest(app)
        .post('/api/user')
        .send(userPasswordEndsSpaces)
        .expect(400, { error: 'Password must not have empty spaces.' });
    });

    it('responds 400 error when password isn\'t complex enough', () => {
      const userPasswordNotComplex = {
        email: 'test email',
        password: '11AAaabb',
        name: 'test name',
      };
      return supertest(app)
        .post('/api/user')
        .send(userPasswordNotComplex)
        .expect(400, { error:'Password must contain one upper case, a lower case, a number and a special character' });
    });

    it('responds 400 \'User email already taken\' when email isn\'t unique', () => {
      const duplicateUser = {
        email: testUser.email,
        password: '11AAaa!!',
        name: 'test name',
      };
      return supertest(app)
        .post('/api/user')
        .send(duplicateUser)
        .expect(400, { error: 'Email already exists. Try again.' });
    });

    describe('Given a valid user registration /api/user', () => {
      it('responds 201, serialized user with no password', () => {
        const newUser = {
          email: 'email@email.com',
          password: '11AAaa!!',
          name: 'test name',
        };
        return supertest(app)
          .post('/api/user')
          .send(newUser)
          .expect(201)
          .expect((res) => {
            expect(res.body).to.have.property('id');
            expect(res.body.email).to.eql(newUser.email);
            expect(res.body.name).to.eql(newUser.name);
            expect(res.body).to.have.property('password');
            expect(res.headers.location).to.eql(`/api/user/${res.body.id}`);
          });
      });

      it('stores the new user in db with bcrypt password', () => {
        const newUser = {
          email: 'email@email.com',
          password: '11AAaa!!',
          name: 'test name',
        };
        return supertest(app)
          .post('/api/user')
          .send(newUser)
          .expect((res) =>
            db
              .from('users')
              .select('*')
              .where({ id: res.body.id })
              .first()
              .then((row) => {
                expect(row.email).to.eql(newUser.email);
                expect(row.name).to.eql(newUser.name);

                return bcrypt.compare(newUser.password, row.password);
              })
              .then((compareMatch) => {
                expect(compareMatch).to.be.true;
              })
          );
      });
    });
  });
  
  describe('{PATCH} token', () => {
    beforeEach('insert users', () => helpers.seedUsers(db, testUsers));
    it('responds 200 and JWT auth token using secret', () => {
      const expectedToken = jwt.sign(
        { id: testUser.id, 
          name: testUser.name 
        },
        process.env.JWT_SECRET,
        {
          subject: testUser.email,
          expiresIn: process.env.JWT_EXPIRY,
          algorithm: 'HS256',
        }
      );
      return supertest(app)
        .put('/api/auth/token')
        .set('Authorization', helpers.makeAuthHeader(testUser))
        .expect(200, {
          authToken: expectedToken,
        });
    });
  });
});
