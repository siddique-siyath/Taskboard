const AppError = require('../utils/AppError');

function notFound(req, _res, next) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, code: 'INVALID_JSON', message: 'Request body is not valid JSON' });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }
  console.error(err);
  res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Something went wrong on the server' });
}

module.exports = { notFound, errorHandler };
