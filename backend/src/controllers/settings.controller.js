const settingsService = require('../services/settings.service');
const asyncHandler = require('../utils/asyncHandler');

exports.get = asyncHandler(async (_req, res) => res.json(await settingsService.get()));
exports.update = asyncHandler(async (req, res) => res.json(await settingsService.update(req.body)));
