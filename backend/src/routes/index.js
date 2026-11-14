const router = require('express').Router();
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');
const auth = require('../controllers/auth.controller');
const tasks = require('../controllers/task.controller');
const settings = require('../controllers/settings.controller');

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.post('/login', validate(s.loginBody), auth.login);

// Everything below requires a valid JWT.
router.use(authenticate);

// Fixed paths must be declared before '/tasks/:id'.
router.get('/tasks/summary', tasks.summary);
router.get('/tasks/board', tasks.board);
router.get('/tasks/capacity', validate(s.capacityQuery, 'query'), tasks.capacity);
router.get('/tasks', validate(s.taskQuery, 'query'), tasks.list);
router.post('/tasks', validate(s.taskBody), tasks.create);
router.get('/tasks/:id', tasks.getById);
router.put('/tasks/:id', validate(s.taskBody), tasks.update);
router.patch('/tasks/:id/status', validate(s.statusBody), tasks.changeStatus);
router.delete('/tasks/:id', tasks.remove);

router.get('/settings', settings.get);
router.put('/settings', validate(s.settingsBody), settings.update);

module.exports = router;
