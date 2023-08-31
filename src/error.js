const { NODE_ENV } = require('./config');
const logs = require('./logs');

// eslint-disable-next-line no-unused-vars
function error(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    // eslint-disable-next-line no-console
    console.error(error);
    logs.error(error.message);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
}

module.exports = error;