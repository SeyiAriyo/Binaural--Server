const supertest = require('supertest');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Protected Endpoints', function () {
  let db;

  const testUsers = helpers.makeUsersArray();

  before('make knex instance', () => {
    db = helpers.makeKnexInstance();
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  const protectedEndpoints = [
    {
      name: '{PUT} /token',
      path: '/api/auth/token',
      method: supertest(app).put,
    },
    {
      name: '{GET} /api/user',
      path: '/api/user',
      method: supertest(app).get,
    },
    {
      name: '{PATCH} /api/user/:id',
      path: '/api/user/1',
      method: supertest(app).patch,
    },
    {
      name: '{DELETE} /api/user/:id',
      path: '/api/user/1',
      method: supertest(app).delete,
    },
  ];

  protectedEndpoints.forEach((endpoint) => {
    describe(endpoint.name, () => {
      it('responds 401 \'Missing bearer token\' when no bearer token', () => {
        return endpoint
          .method(endpoint.path)
          .expect(401, { error: 'Missing bearer token.' });
      });

      it('responds 401 \'Unauthorized request\' when invalid JWT secret', () => {
        const validUser = testUsers[0];
        const invalidSecret = 'bad-secret';
        return endpoint
          .method(endpoint.path)
          .set(
            'Authorization',
            helpers.makeAuthHeader(validUser, invalidSecret)
          )
          .expect(401, { error: 'Unauthorized request.' });
      });

      it('responds 401 \'Unauthorized request\' when invalid sub in payload', () => {
        const invalidUser = {
          email: 'user-not-exist', 
          id: 1 
        };
		
        return endpoint
          .method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: 'Unauthorized request.' });
      });
    });
  });
});
