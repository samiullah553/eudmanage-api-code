function errorHandler(err, req, res, next) {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  const isProd = process.env.NODE_ENV === 'production';

  const payload = {
    error: isProd && status === 500 ? 'Internal Server Error' : err.message || 'Unexpected error'
  };

  if (!isProd) payload.stack = err.stack;
  res.status(status).json(payload);
}

module.exports = errorHandler;