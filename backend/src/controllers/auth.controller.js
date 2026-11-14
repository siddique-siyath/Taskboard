const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

exports.login = asyncHandler(async (req, res) => {
  res.json(await authService.login(req.body.email, req.body.password));
});
