// Central error handler — every controller passes errors to next(err)
function errorHandler(err, req, res, next) {
  console.error(err.stack || err);

  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong on the server';

  res.status(status).json({
    success: false,
    message,
  });
}

// Wraps async route handlers so thrown errors reach errorHandler
// without needing try/catch in every controller function.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };
