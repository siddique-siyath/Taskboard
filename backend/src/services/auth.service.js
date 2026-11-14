const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');
const userRepo = require('../repositories/user.repository');
const AppError = require('../utils/AppError');

async function login(email, password) {
  const user = await userRepo.findByEmail(email.toLowerCase());
  // Same message for unknown email and wrong password
  const valid = user && (await bcrypt.compare(password, user.password_hash));
  if (!valid) throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');

  const token = jwt.sign({ sub: user.id, email: user.email }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
}

module.exports = { login };
