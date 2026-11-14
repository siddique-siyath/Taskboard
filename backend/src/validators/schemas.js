const Joi = require('joi');
const { isValidIsoDate } = require('../utils/dates');

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Backlog', 'Planned', 'In Progress', 'Completed'];

const isoDate = Joi.string()
  .custom((value, helpers) => (isValidIsoDate(value) ? value : helpers.error('date.format')))
  .messages({ 'date.format': '{{#label}} must be a valid date (YYYY-MM-DD)' });

const taskBody = Joi.object({
  title: Joi.string().trim().max(200).required().messages({
    'string.empty': 'Task title is required',
    'any.required': 'Task title is required',
  }),
  description: Joi.string().trim().max(2000).allow('', null).default(null),
  storyPoints: Joi.number().integer().min(1).max(100).required().messages({
    'number.base': 'Story points must be a number',
    'number.integer': 'Story points must be a whole number',
    'number.min': 'Story points must be greater than zero',
    'any.required': 'Story points are required',
  }),
  priority: Joi.string().valid(...PRIORITIES).required().messages({
    'any.only': `Priority must be one of: ${PRIORITIES.join(', ')}`,
    'any.required': 'Priority is required',
  }),
  status: Joi.string().valid(...STATUSES).default('Backlog'),
  plannedDate: isoDate.required().messages({ 'any.required': 'Planned date is required' }),
  dueDate: isoDate.allow('', null).default(null),
}).custom((value, helpers) => {
  if (value.dueDate && value.dueDate < value.plannedDate) {
    return helpers.message('Due date cannot be earlier than the planned date');
  }
  return value;
});

const statusBody = Joi.object({
  status: Joi.string().valid(...STATUSES).required().messages({
    'any.only': `Status must be one of: ${STATUSES.join(', ')}`,
    'any.required': 'Status is required',
  }),
});

const taskQuery = Joi.object({
  search: Joi.string().trim().allow('').default(''),
  priority: Joi.string().valid(...PRIORITIES).allow('').default(''),
  status: Joi.string().valid(...STATUSES).allow('').default(''),
  sortBy: Joi.string().valid('title', 'storyPoints', 'priority', 'status', 'plannedDate', 'dueDate', 'createdAt').default('plannedDate'),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('asc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const capacityQuery = Joi.object({
  date: isoDate.required(),
  excludeId: Joi.number().integer().min(1).optional(),
});

const settingsBody = Joi.object({
  dailyPointLimit: Joi.number().integer().min(1).max(1000).required().messages({
    'number.base': 'Daily limit must be a number',
    'number.min': 'Daily limit must be at least 1',
    'number.integer': 'Daily limit must be a whole number',
    'any.required': 'Daily limit is required',
  }),
  weeklyPointLimit: Joi.number().integer().min(1).max(5000).required().messages({
    'number.base': 'Weekly limit must be a number',
    'number.min': 'Weekly limit must be at least 1',
    'number.integer': 'Weekly limit must be a whole number',
    'any.required': 'Weekly limit is required',
  }),
}).custom((value, helpers) => (
  value.weeklyPointLimit < value.dailyPointLimit
    ? helpers.message('Weekly limit cannot be lower than the daily limit')
    : value));

const loginBody = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Enter a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

module.exports = { taskBody, statusBody, taskQuery, capacityQuery, settingsBody, loginBody, PRIORITIES, STATUSES };
