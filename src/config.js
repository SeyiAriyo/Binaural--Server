module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://dunder_mifflin:2@localhost/binaural',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 
    'postgresql://dunder_mifflin:2@localhost/binaural-test',
  API_TOKEN: process.env.API_TOKEN,
  JWT_SECRET: process.env.JWT_SECRET || 'capstone3-secret',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '2h',
};