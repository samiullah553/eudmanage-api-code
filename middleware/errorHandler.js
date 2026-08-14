const { error: respError } = require('../utils/response');

module.exports = function errorHandler(err, req, res, next) {
  console.error(err && err.stack ? err.stack : err);
  const status = err && err.status ? err.status : (err && err.name === 'ValidationError' ? 400 : 500);
  const message = err && err.message ? err.message : 'Internal Server Error';
  const details = process.env.NODE_ENV !== 'production' ? { stack: err && err.stack } : undefined;
  return respError(res, message, status, details);
};