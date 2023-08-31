process.env.NODE_ENV || 'test',
process.env.JWT_SECRET || 'capstone3-secret',
process.env.JWT_EXPIRY || '2h',

require('dotenv').config();

process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 
    'postgresql://dunder_mifflin:2@localhost/binaural-test';

const { expect } = require('chai');
const supertest = require('supertest');

global.expect = expect;
global.supertest = supertest;
