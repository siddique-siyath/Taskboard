const taskService = require('../services/task.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AppError(400, 'Task id must be a positive integer', 'VALIDATION_ERROR');
  return id;
};

exports.list = asyncHandler(async (req, res) => res.json(await taskService.list(req.validatedQuery)));
exports.board = asyncHandler(async (_req, res) => res.json(await taskService.board()));
exports.summary = asyncHandler(async (_req, res) => res.json(await taskService.summary()));
exports.capacity = asyncHandler(async (req, res) => {
  res.json(await taskService.capacityPreview(req.validatedQuery.date, req.validatedQuery.excludeId));
});
exports.getById = asyncHandler(async (req, res) => res.json(await taskService.getById(parseId(req.params.id))));
exports.create = asyncHandler(async (req, res) => res.status(201).json(await taskService.create(req.body)));
exports.update = asyncHandler(async (req, res) => res.json(await taskService.update(parseId(req.params.id), req.body)));
exports.changeStatus = asyncHandler(async (req, res) => {
  res.json(await taskService.changeStatus(parseId(req.params.id), req.body.status));
});
exports.remove = asyncHandler(async (req, res) => {
  await taskService.remove(parseId(req.params.id));
  res.status(204).send();
});
