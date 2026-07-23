function notFoundHandler(req, res, next) {
  const err = new Error(`Not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  err.code = 'NOT_FOUND';
  next(err);
}

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const _next = next;

  if (res.headersSent) {
    console.error('[error] Headers already sent:', err.message);
    return;
  }

  const status = err.status || err.statusCode || 500;
  const payload = {
    error: err.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR'),
    message: err.message || 'An unexpected error occurred',
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);
  }

  res.status(status).json(payload);
}

function createError(status, message, code, details) {
  const err = new Error(message);
  err.status = status;
  if (code) err.code = code;
  if (details !== undefined) err.details = details;
  return err;
}

module.exports = {
  notFoundHandler,
  errorHandler,
  createError,
};
