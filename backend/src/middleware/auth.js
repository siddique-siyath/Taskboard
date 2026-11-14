const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');
const AppError = require('../utils/AppError');

module.exports = function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
  }
  try {
    req.user = jwt.verify(token, jwtConfig.secret);
    next();
  } catch {
    next(new AppError(401, 'Session expired or invalid. Please log in again.', 'UNAUTHORIZED'));
  }
};
