const taskRepo = require('../repositories/task.repository');
const settingsRepo = require('../repositories/settings.repository');
const AppError = require('../utils/AppError');
const { weekRange } = require('../utils/dates');

// Backlog tasks do not reserve capacity. Every other status does, so moving a task
// between Planned / In Progress / Completed never changes the totals.
const CAPACITY_STATUSES = ['Planned', 'In Progress', 'Completed'];

/** Planned vs. limit numbers for a day and its Monday-Sunday week (optionally ignoring one task). */
async function getUsage(date, excludeId, conn) {
  const settings = await settingsRepo.get(conn);
  const { start, end } = weekRange(date);
  const [dailyPlanned, weeklyPlanned] = await Promise.all([
    taskRepo.sumPoints({ from: date, to: date, statuses: CAPACITY_STATUSES, excludeId }, conn),
    taskRepo.sumPoints({ from: start, to: end, statuses: CAPACITY_STATUSES, excludeId }, conn),
  ]);
  return {
    date,
    weekStart: start,
    weekEnd: end,
    dailyLimit: settings.dailyPointLimit,
    weeklyLimit: settings.weeklyPointLimit,
    dailyPlanned,
    weeklyPlanned,
    dailyRemaining: Math.max(settings.dailyPointLimit - dailyPlanned, 0),
    weeklyRemaining: Math.max(settings.weeklyPointLimit - weeklyPlanned, 0),
  };
}

/** Throws 422 when adding `points` on `date` would break the daily or weekly limit. */
async function assertWithinLimits({ date, points, excludeId }, conn) {
  const usage = await getUsage(date, excludeId, conn);

  if (usage.dailyPlanned + points > usage.dailyLimit) {
    throw new AppError(
      422,
      `Daily capacity exceeded on ${date}: limit ${usage.dailyLimit}, already planned ${usage.dailyPlanned}, this task ${points} (remaining ${usage.dailyRemaining}).`,
      'DAILY_CAPACITY_EXCEEDED',
      usage,
    );
  }
  if (usage.weeklyPlanned + points > usage.weeklyLimit) {
    throw new AppError(
      422,
      `Weekly capacity exceeded for ${usage.weekStart} to ${usage.weekEnd}: limit ${usage.weeklyLimit}, already planned ${usage.weeklyPlanned}, this task ${points} (remaining ${usage.weeklyRemaining}).`,
      'WEEKLY_CAPACITY_EXCEEDED',
      usage,
    );
  }
  return usage;
}

/**
 * Capacity is only consumed when a task leaves Backlog, or when an active task
 * changes its points or planned date. Pure status moves between active columns are free.
 */
function needsCapacityCheck(previous, next) {
  if (next.status === 'Backlog') return false;
  if (!previous || previous.status === 'Backlog') return true;
  return previous.storyPoints !== next.storyPoints || previous.plannedDate !== next.plannedDate;
}

module.exports = { getUsage, assertWithinLimits, needsCapacityCheck };
