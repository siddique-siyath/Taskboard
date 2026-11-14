const taskRepo = require('../repositories/task.repository');
const settingsRepo = require('../repositories/settings.repository');
const capacity = require('./capacity.service');
const AppError = require('../utils/AppError');
const { withTransaction } = require('../config/db');
const { STATUSES } = require('../validators/schemas');

const notFound = () => new AppError(404, 'Task not found', 'TASK_NOT_FOUND');

function assertTransitionAllowed(previous, nextStatus) {
  if (previous.status === 'Completed' && nextStatus === 'Backlog') {
    throw new AppError(422, 'Completed tasks cannot be moved back to Backlog', 'INVALID_TRANSITION');
  }
}

/**
 * Runs `work` in a transaction after locking the settings row. Every capacity-affecting
 * write goes through here, so two concurrent requests cannot both pass the check.
 */
const withCapacityLock = (work) => withTransaction(async (conn) => {
  await settingsRepo.get(conn, { lock: true });
  return work(conn);
});

async function list(query) {
  const { items, total } = await taskRepo.findPage(query);
  return {
    data: items,
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.max(Math.ceil(total / query.limit), 1) },
  };
}

const board = () => taskRepo.findAll();

async function getById(id) {
  const task = await taskRepo.findById(id);
  if (!task) throw notFound();
  return task;
}

async function create(body) {
  return withCapacityLock(async (conn) => {
    if (capacity.needsCapacityCheck(null, body)) {
      await capacity.assertWithinLimits({ date: body.plannedDate, points: body.storyPoints }, conn);
    }
    const id = await taskRepo.insert(body, conn);
    return taskRepo.findById(id, conn);
  });
}

async function update(id, body) {
  return withCapacityLock(async (conn) => {
    const previous = await taskRepo.findById(id, conn, { lock: true });
    if (!previous) throw notFound();
    assertTransitionAllowed(previous, body.status);
    if (capacity.needsCapacityCheck(previous, body)) {
      await capacity.assertWithinLimits({ date: body.plannedDate, points: body.storyPoints, excludeId: id }, conn);
    }
    await taskRepo.update(id, body, conn);
    return taskRepo.findById(id, conn);
  });
}

async function changeStatus(id, status) {
  return withCapacityLock(async (conn) => {
    const previous = await taskRepo.findById(id, conn, { lock: true });
    if (!previous) throw notFound();
    if (previous.status === status) return previous;
    assertTransitionAllowed(previous, status);
    if (capacity.needsCapacityCheck(previous, { ...previous, status })) {
      await capacity.assertWithinLimits({ date: previous.plannedDate, points: previous.storyPoints, excludeId: id }, conn);
    }
    await taskRepo.updateStatus(id, status, conn);
    return taskRepo.findById(id, conn);
  });
}

async function remove(id) {
  if (!(await taskRepo.remove(id))) throw notFound();
}

async function summary() {
  const rows = await taskRepo.summary();
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  let totalStoryPoints = 0;
  for (const r of rows) {
    counts[r.status] = Number(r.count);
    totalStoryPoints += Number(r.points);
  }
  return {
    totalTasks: Object.values(counts).reduce((a, b) => a + b, 0),
    backlogTasks: counts.Backlog,
    plannedTasks: counts.Planned,
    inProgressTasks: counts['In Progress'],
    completedTasks: counts.Completed,
    totalStoryPoints,
  };
}

const capacityPreview = (date, excludeId) => capacity.getUsage(date, excludeId);

module.exports = { list, board, getById, create, update, changeStatus, remove, summary, capacityPreview };
